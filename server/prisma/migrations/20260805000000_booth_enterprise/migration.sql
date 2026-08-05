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
