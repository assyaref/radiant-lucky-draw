/**
 * Environment Configuration
 *
 * Centralized environment variable access with validation.
 * Uses dotenv for local development.
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Validation ────────────────────────────────────────────

interface EnvValidation {
  key: string;
  required: boolean;
  production: boolean;
}

const validations: EnvValidation[] = [
  { key: 'DATABASE_URL', required: true, production: true },
  { key: 'JWT_SECRET', required: true, production: true },
  { key: 'JWT_REFRESH_SECRET', required: true, production: true },
  { key: 'PORT', required: false, production: false },
  { key: 'NODE_ENV', required: false, production: false },
  { key: 'CORS_ORIGIN', required: false, production: false },
  { key: 'COOKIE_SECURE', required: false, production: false },
];

function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === 'production';

  for (const validation of validations) {
    if (validation.required && !process.env[validation.key]) {
      const message = `[Env Validation] Missing required environment variable: ${validation.key}`;
      if (isProduction) {
        console.error(message);
        process.exit(1);
      } else {
        console.warn(message);
      }
    }

    if (isProduction && validation.production && !process.env[validation.key]) {
      console.warn(`[Env Validation] Missing production environment variable: ${validation.key}`);
    }
  }
}

// ─── Environment Object ────────────────────────────────────

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT (secrets are REQUIRED - no fallbacks allowed)
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Cookies
  COOKIE_NAME: process.env.COOKIE_NAME || 'radiant_refresh',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',
  COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict' | 'none',
  COOKIE_MAX_AGE_MS: parseInt(process.env.COOKIE_MAX_AGE_MS || '604800000', 10), // 7 days

  // CORS — comma-separated origins; production-safe default includes the Vercel
  // frontend so the API works out-of-the-box without env-variable configuration.
  CORS_ORIGIN:
    process.env.CORS_ORIGIN ||
    [
      'https://radiant-lucky-draw.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ].join(','),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // Registration rate limiting (GO LIVE HOTFIX)
  // A single event venue shares one network (one public IP) for up to 300
  // participants. The registration endpoint therefore needs a much higher
  // per-IP allowance than the general API limiter.
  REGISTRATION_RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS || '900000',
    10,
  ),
  REGISTRATION_RATE_LIMIT_MAX: parseInt(process.env.REGISTRATION_RATE_LIMIT_MAX || '600', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'dev',

  // Derived
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

// Run validation on import
validateEnv();
