import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });

async function runMigration() {
  const client = await pool.connect();
  try {
    // Make drawId nullable
    await client.query(`
      ALTER TABLE "winners" ALTER COLUMN "drawId" DROP NOT NULL;
    `);
    console.log('Made drawId nullable');

    // Make participantId nullable
    await client.query(`
      ALTER TABLE "winners" ALTER COLUMN "participantId" DROP NOT NULL;
    `);
    console.log('Made participantId nullable');

    // The unique constraint on drawId should still work with NULL values in PostgreSQL
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();