#!/usr/bin/env bash
# ============================================================
# RADIANT LUCKY DRAW — Copy data from Railway Postgres to Supabase
# ============================================================
# Usage:
#   SOURCE_DATABASE_URL="postgresql://...railway..." \
#   SUPABASE_DIRECT_URL="postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
#   ./scripts/migrate-railway-to-supabase.sh
#
# Steps:
#   1. Checks the source DB has every Prisma migration applied
#   2. Runs `prisma migrate deploy` on Supabase (creates schema + RLS)
#   3. Refuses to continue if Supabase tables already contain data
#   4. Dumps DATA ONLY from Railway (public schema, without _prisma_migrations)
#   5. Restores into Supabase in one transaction with FK triggers disabled
#   6. Compares row counts table by table
#
# Requirements: pg_dump / psql (client version >= source server version),
#               node + npm deps installed in ./server (for prisma CLI).
# Stop writes to the app (maintenance) before running, so no data is lost.
# ============================================================
set -euo pipefail

: "${SOURCE_DATABASE_URL:?Set SOURCE_DATABASE_URL (Railway Postgres URL)}"
: "${SUPABASE_DIRECT_URL:?Set SUPABASE_DIRECT_URL (Supabase session pooler, port 5432)}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKDIR="$(mktemp -d)"
DUMP="$WORKDIR/data.sql"
trap 'rm -rf "$WORKDIR"' EXIT

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

command -v pg_dump >/dev/null || die "pg_dump not found"
command -v psql >/dev/null || die "psql not found"

# ─── 1. Source must be on the latest migration ──────────────
log "Checking migrations applied on source"
EXPECTED=$(cd "$ROOT/server/prisma/migrations" && ls -d */ | sed 's#/##' \
  | grep -v '_supabase_enable_rls$' | sort)
APPLIED=$(psql "$SOURCE_DATABASE_URL" -At -c \
  "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY 1")
MISSING=$(comm -23 <(echo "$EXPECTED") <(echo "$APPLIED" | sort) || true)
[ -z "$MISSING" ] || die "Source DB is missing migrations:\n$MISSING\nRun 'prisma migrate deploy' on Railway first."

# ─── 2. Create schema on Supabase ───────────────────────────
log "Applying Prisma migrations to Supabase"
(cd "$ROOT/server" && DATABASE_URL="$SUPABASE_DIRECT_URL" DIRECT_URL="$SUPABASE_DIRECT_URL" \
  npx prisma migrate deploy)

TABLES=$(psql "$SUPABASE_DIRECT_URL" -At -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations' ORDER BY 1")

# ─── 3. Target must be empty ────────────────────────────────
log "Checking Supabase tables are empty"
for t in $TABLES; do
  n=$(psql "$SUPABASE_DIRECT_URL" -At -c "SELECT count(*) FROM public.\"$t\"")
  [ "$n" = "0" ] || die "Supabase table '$t' already has $n rows. Aborting to avoid duplicates."
done

# ─── 4. Dump data from Railway ──────────────────────────────
log "Dumping data from Railway"
pg_dump "$SOURCE_DATABASE_URL" \
  --data-only --schema=public \
  --exclude-table=public._prisma_migrations \
  --no-owner --no-privileges \
  --file="$DUMP"
echo "Dump size: $(du -h "$DUMP" | cut -f1)"

# ─── 5. Restore into Supabase ───────────────────────────────
log "Restoring data into Supabase"
psql "$SUPABASE_DIRECT_URL" \
  --single-transaction --variable ON_ERROR_STOP=1 --quiet \
  --command 'SET session_replication_role = replica' \
  --file "$DUMP"

# ─── 6. Verify row counts ───────────────────────────────────
log "Verifying row counts (railway → supabase)"
FAIL=0
for t in $TABLES; do
  src=$(psql "$SOURCE_DATABASE_URL" -At -c "SELECT count(*) FROM public.\"$t\"" 2>/dev/null || echo "n/a")
  dst=$(psql "$SUPABASE_DIRECT_URL" -At -c "SELECT count(*) FROM public.\"$t\"")
  status="OK"; [ "$src" = "$dst" ] || { status="MISMATCH"; FAIL=1; }
  printf '  %-22s %8s → %-8s %s\n' "$t" "$src" "$dst" "$status"
done

[ "$FAIL" = "0" ] || die "Row counts differ — check the output above."
log "Done. Update DATABASE_URL / DIRECT_URL on Railway to the Supabase URLs and redeploy."
