-- AlterTable: PARTICIPANT
-- Increase photo_url from VARCHAR(500) to TEXT to support base64 data URLs.
ALTER TABLE "participants" ALTER COLUMN "photo_url" TYPE TEXT;