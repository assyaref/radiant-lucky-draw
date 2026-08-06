-- M4.0: Event and Booth models
CREATE TABLE "events" (
    "id" UUID NOT NULL, "name" VARCHAR(200) NOT NULL, "description" TEXT, "location" VARCHAR(300),
    "start_date" TIMESTAMP(3), "end_date" TIMESTAMP(3), "status" VARCHAR(20) NOT NULL DEFAULT '\''upcoming'\'',
    "logo_url" VARCHAR(500), "banner_url" VARCHAR(500), "theme" VARCHAR(20),
    "created_by" UUID, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL, "deleted_at" TIMESTAMP(3), CONSTRAINT "events_pkey" PRIMARY KEY ("id"));
CREATE TABLE "booths" (
    "id" UUID NOT NULL, "name" VARCHAR(100) NOT NULL, "code" VARCHAR(20) NOT NULL,
    "location" VARCHAR(300), "status" VARCHAR(20) NOT NULL DEFAULT '\''active'\'',
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