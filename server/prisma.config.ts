// ============================================================
// Prisma Configuration (v7)
// ============================================================

import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables so the datasource URL is available
// to `prisma migrate` / `prisma db push` commands.
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || '',
  },
});
