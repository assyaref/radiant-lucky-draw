-- Add missing claimed_at and claimed_by columns to winners table
ALTER TABLE "winners" ADD COLUMN "claimed_at" TIMESTAMP(3);
ALTER TABLE "winners" ADD COLUMN "claimed_by" UUID;
