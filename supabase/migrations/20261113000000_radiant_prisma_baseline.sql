-- Baseline: all former Prisma migrations (server/prisma/migrations, now removed) + RLS on every table.
-- _prisma_migrations is kept for history only; schema changes now go in supabase/migrations.
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"              VARCHAR(64) NOT NULL,
    "finished_at"           TIMESTAMPTZ,
    "migration_name"        VARCHAR(255) NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        TIMESTAMPTZ,
    "started_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count"   INTEGER NOT NULL DEFAULT 0
);

-- ===== 20260803000000_init =====
-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'operator',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token" VARCHAR(500) NOT NULL,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" VARCHAR(200),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "company" VARCHAR(100),
    "queueNumber" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'registered',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "called_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prizes" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "remaining" INTEGER NOT NULL DEFAULT 1,
    "image_url" VARCHAR(500),
    "sponsor" VARCHAR(200),
    "tier" VARCHAR(20) NOT NULL DEFAULT 'bronze',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draws" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "prize_id" UUID NOT NULL,
    "prize_name" VARCHAR(200) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "winner_id" UUID,
    "winner_name" VARCHAR(100),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draw_participants" (
    "id" UUID NOT NULL,
    "draw_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draw_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winners" (
    "id" UUID NOT NULL,
    "draw_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "prize_id" UUID NOT NULL,
    "prize_tier" VARCHAR(20) NOT NULL,
    "prize_value" DOUBLE PRECISION NOT NULL,
    "announced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "participant_name" VARCHAR(100) NOT NULL,
    "queue_number" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'waiting',
    "called_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "draw_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsors" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "logo_url" VARCHAR(500),
    "website_url" VARCHAR(500),
    "tier" VARCHAR(20) NOT NULL DEFAULT 'standard',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'info',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "event_name" VARCHAR(200) NOT NULL,
    "event_date" TIMESTAMP(3),
    "max_participants" INTEGER NOT NULL DEFAULT 1000,
    "draw_interval" INTEGER NOT NULL DEFAULT 30,
    "celebration_level" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "theme" VARCHAR(20) NOT NULL DEFAULT 'dark',
    "sound_enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_advance" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "entity" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_refresh_token_idx" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "sessions_deleted_at_idx" ON "sessions"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "participants_phone_key" ON "participants"("phone");

-- CreateIndex
CREATE INDEX "participants_status_idx" ON "participants"("status");

-- CreateIndex
CREATE INDEX "participants_queueNumber_idx" ON "participants"("queueNumber");

-- CreateIndex
CREATE INDEX "participants_deleted_at_idx" ON "participants"("deleted_at");

-- CreateIndex
CREATE INDEX "prizes_tier_idx" ON "prizes"("tier");

-- CreateIndex
CREATE INDEX "prizes_is_active_idx" ON "prizes"("is_active");

-- CreateIndex
CREATE INDEX "prizes_deleted_at_idx" ON "prizes"("deleted_at");

-- CreateIndex
CREATE INDEX "draws_status_idx" ON "draws"("status");

-- CreateIndex
CREATE INDEX "draws_prize_id_idx" ON "draws"("prize_id");

-- CreateIndex
CREATE INDEX "draws_deleted_at_idx" ON "draws"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "draw_participants_draw_id_participant_id_key" ON "draw_participants"("draw_id", "participant_id");

-- CreateIndex
CREATE INDEX "draw_participants_draw_id_idx" ON "draw_participants"("draw_id");

-- CreateIndex
CREATE INDEX "draw_participants_participant_id_idx" ON "draw_participants"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "winners_draw_id_key" ON "winners"("draw_id");

-- CreateIndex
CREATE INDEX "winners_participant_id_idx" ON "winners"("participant_id");

-- CreateIndex
CREATE INDEX "winners_prize_id_idx" ON "winners"("prize_id");

-- CreateIndex
CREATE INDEX "winners_prize_tier_idx" ON "winners"("prize_tier");

-- CreateIndex
CREATE INDEX "winners_deleted_at_idx" ON "winners"("deleted_at");

-- CreateIndex
CREATE INDEX "queue_entries_status_idx" ON "queue_entries"("status");

-- CreateIndex
CREATE INDEX "queue_entries_queue_number_idx" ON "queue_entries"("queue_number");

-- CreateIndex
CREATE INDEX "queue_entries_participant_id_idx" ON "queue_entries"("participant_id");

-- CreateIndex
CREATE INDEX "queue_entries_draw_id_idx" ON "queue_entries"("draw_id");

-- CreateIndex
CREATE INDEX "queue_entries_deleted_at_idx" ON "queue_entries"("deleted_at");

-- CreateIndex
CREATE INDEX "sponsors_tier_idx" ON "sponsors"("tier");

-- CreateIndex
CREATE INDEX "sponsors_is_active_idx" ON "sponsors"("is_active");

-- CreateIndex
CREATE INDEX "sponsors_sort_order_idx" ON "sponsors"("sort_order");

-- CreateIndex
CREATE INDEX "sponsors_deleted_at_idx" ON "sponsors"("deleted_at");

-- CreateIndex
CREATE INDEX "announcements_type_idx" ON "announcements"("type");

-- CreateIndex
CREATE INDEX "announcements_is_active_idx" ON "announcements"("is_active");

-- CreateIndex
CREATE INDEX "announcements_priority_idx" ON "announcements"("priority");

-- CreateIndex
CREATE INDEX "announcements_deleted_at_idx" ON "announcements"("deleted_at");

-- CreateIndex
CREATE INDEX "settings_deleted_at_idx" ON "settings"("deleted_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draws" ADD CONSTRAINT "draws_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_participants" ADD CONSTRAINT "draw_participants_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_participants" ADD CONSTRAINT "draw_participants_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "draws"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (gen_random_uuid()::text, '3eab6d49645287819962b7708d93c90d8c80b7870d5467ba9f8507db33aa7974', now(), '20260803000000_init', 1);

-- ===== 20260805000000_booth_enterprise =====
-- ============================================================
-- RADIANT LUCKY DRAW - Booth Enterprise Migration
-- Adds fields for the Digital Lucky Draw Booth Enterprise flow.
-- Does NOT modify or remove any existing tables/columns.
-- ============================================================

-- AlterTable: PRIZE
-- Add probability field for weighted draw selection.
ALTER TABLE "prizes" ADD COLUMN "probability" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: PARTICIPANT
-- Add photo, prize reference, and claim status fields.
ALTER TABLE "participants" ADD COLUMN "photo_url" VARCHAR(500);
ALTER TABLE "participants" ADD COLUMN "prize_id" UUID;
ALTER TABLE "participants" ADD COLUMN "claim_status" VARCHAR(20) NOT NULL DEFAULT 'unclaimed';

-- CreateIndex: PARTICIPANT
CREATE INDEX "participants_claim_status_idx" ON "participants"("claim_status");
CREATE INDEX "participants_prize_id_idx" ON "participants"("prize_id");

-- AlterTable: WINNER
-- Add claim status field.
ALTER TABLE "winners" ADD COLUMN "claim_status" VARCHAR(20) NOT NULL DEFAULT 'unclaimed';

-- CreateIndex: WINNER
CREATE INDEX "winners_claim_status_idx" ON "winners"("claim_status");

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (gen_random_uuid()::text, '4696581f5022e6ba58d0eb0143d7596e0a1da6832ce6ec52a6b5bb2fe44975b9', now(), '20260805000000_booth_enterprise', 1);

-- ===== 20260807000000_m4_0_event_booth =====
-- M4.0: Event and Booth models
CREATE TABLE "events" (
    "id" UUID NOT NULL, "name" VARCHAR(200) NOT NULL, "description" TEXT, "location" VARCHAR(300),
    "start_date" TIMESTAMP(3), "end_date" TIMESTAMP(3), "status" VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    "logo_url" VARCHAR(500), "banner_url" VARCHAR(500), "theme" VARCHAR(20),
    "created_by" UUID, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, "deleted_at" TIMESTAMP(3), CONSTRAINT "events_pkey" PRIMARY KEY ("id"));
CREATE TABLE "booths" (
    "id" UUID NOT NULL, "name" VARCHAR(100) NOT NULL, "code" VARCHAR(20) NOT NULL,
    "location" VARCHAR(300), "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "event_id" UUID NOT NULL, "operator_id" UUID, "theme" VARCHAR(20), "qr_code" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3), CONSTRAINT "booths_pkey" PRIMARY KEY ("id"));
ALTER TABLE "participants" ADD COLUMN "event_id" UUID;
ALTER TABLE "prizes" ADD COLUMN "event_id" UUID;
ALTER TABLE "draws" ADD COLUMN "event_id" UUID;
ALTER TABLE "winners" ADD COLUMN "event_id" UUID;
CREATE UNIQUE INDEX "booths_code_key" ON "booths"("code");
CREATE INDEX "events_status_idx" ON "events"("status");
CREATE INDEX "events_deleted_at_idx" ON "events"("deleted_at");
CREATE INDEX "booths_event_id_idx" ON "booths"("event_id");
CREATE INDEX "booths_status_idx" ON "booths"("status");
CREATE INDEX "booths_deleted_at_idx" ON "booths"("deleted_at");
CREATE INDEX "participants_event_id_idx" ON "participants"("event_id");
CREATE INDEX "prizes_event_id_idx" ON "prizes"("event_id");
CREATE INDEX "draws_event_id_idx" ON "draws"("event_id");
CREATE INDEX "winners_event_id_idx" ON "winners"("event_id");
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "booths" ADD CONSTRAINT "booths_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booths" ADD CONSTRAINT "booths_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "participants" ADD CONSTRAINT "participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prizes" ADD CONSTRAINT "prizes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "draws" ADD CONSTRAINT "draws_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "winners" ADD CONSTRAINT "winners_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (gen_random_uuid()::text, 'cd93d411e03856422219e39d34d62ee65bfe3ebc68afd311c01e7670bf887984', now(), '20260807000000_m4_0_event_booth', 1);

-- ===== 20260807010000_fix_photo_url_text =====
-- AlterTable: PARTICIPANT
-- Increase photo_url from VARCHAR(500) to TEXT to support base64 data URLs.
ALTER TABLE "participants" ALTER COLUMN "photo_url" TYPE TEXT;
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (gen_random_uuid()::text, '07be5177fa0b23aed2474b4193ce1e42c4fd3da1347ed86ddd0f5ed1d93cb942', now(), '20260807010000_fix_photo_url_text', 1);

-- ===== 20260808000000_add_missing_settings_columns =====
-- Add missing columns to settings table (schema already defines them)
ALTER TABLE "settings" ADD COLUMN "event_location" VARCHAR(300);
ALTER TABLE "settings" ADD COLUMN "event_status" VARCHAR(20) NOT NULL DEFAULT 'upcoming';
ALTER TABLE "settings" ADD COLUMN "event_description" TEXT;
ALTER TABLE "settings" ADD COLUMN "logo_url" VARCHAR(500);
ALTER TABLE "settings" ADD COLUMN "banner_url" VARCHAR(500);
ALTER TABLE "settings" ADD COLUMN "background_url" VARCHAR(500);
ALTER TABLE "settings" ADD COLUMN "primary_color" VARCHAR(9) NOT NULL DEFAULT '#3b82f6';
ALTER TABLE "settings" ADD COLUMN "secondary_color" VARCHAR(9) NOT NULL DEFAULT '#8b5cf6';
ALTER TABLE "settings" ADD COLUMN "sponsor_ids" JSONB;

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (gen_random_uuid()::text, '79250238ec57d56a83197c865ab9743f923f794bbde1e5b01aa9b8938086f76c', now(), '20260808000000_add_missing_settings_columns', 1);

-- ===== 20260808010000_add_claimed_at_by_to_winners =====
-- Add missing claimed_at and claimed_by columns to winners table
ALTER TABLE "winners" ADD COLUMN "claimed_at" TIMESTAMP(3);
ALTER TABLE "winners" ADD COLUMN "claimed_by" UUID;

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (gen_random_uuid()::text, '0bad8cb7db30f594a7e57c4eaf4624145986f1c08e315aae41c86331e16506d4', now(), '20260808010000_add_claimed_at_by_to_winners', 1);

-- ===== 20261113000000_supabase_enable_rls =====
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

INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (gen_random_uuid()::text, '94ceb8f168cdd691c9ca0ffa45648a2651bacc96367b5538d07d5e001e092519', now(), '20261113000000_supabase_enable_rls', 1);
