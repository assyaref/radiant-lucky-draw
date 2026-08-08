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
