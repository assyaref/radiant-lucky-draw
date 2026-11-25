-- Migration: make_winner_fields_optional
-- Make drawId and participantId nullable in winners table for name spins

-- Make drawId nullable (remove NOT NULL constraint)
ALTER TABLE "winners" ALTER COLUMN "drawId" DROP NOT NULL;

-- Make participantId nullable (remove NOT NULL constraint)
ALTER TABLE "winners" ALTER COLUMN "participantId" DROP NOT NULL;

-- The unique constraint on drawId still allows multiple NULL values in PostgreSQL
-- No changes needed for the unique index