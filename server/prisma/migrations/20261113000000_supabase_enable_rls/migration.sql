-- ============================================================
-- Supabase hardening: enable Row Level Security on every table
-- ============================================================
-- Supabase exposes the `public` schema through its auto-generated REST
-- (PostgREST) and GraphQL APIs using the `anon` / `authenticated` roles.
-- Without RLS, anyone holding the project's anon key could read tables
-- such as `users` (password hashes) and `sessions` (refresh tokens).
--
-- Enabling RLS with NO policies denies all access through those APIs.
-- The backend connects as the `postgres` role (table owner, BYPASSRLS),
-- so Prisma queries are unaffected. On plain local Postgres this is a
-- harmless no-op for the owner role.
--
-- NOTE: any new table added in a future migration must also get
--   ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;
-- ============================================================

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END
$$;
