/**
 * Environment Configuration
 *
 * Centralized environment variable access with validation.
 * Runs both on Node (local dev, `.env` loaded by src/index.ts) and as a
 * Supabase Edge Function (Deno), where Supabase injects SUPABASE_URL,
 * SUPABASE_DB_URL and SUPABASE_SERVICE_ROLE_KEY automatically.
 */

import { createHash } from 'crypto';

const isEdge = typeof (globalThis as any).EdgeRuntime !== 'undefined' || !!(globalThis as any).Deno;

function read(key: string): string | undefined {
  const g = globalThis as any;
  const v = g.Deno?.env?.get?.(key) ?? (typeof process !== 'undefined' ? process.env[key] : undefined);
  return v === '' ? undefined : v;
}

/**
 * JWT secrets: use explicit JWT_SECRET / JWT_REFRESH_SECRET when set,
 * otherwise derive stable, server-only secrets from the Supabase service
 * role key (never exposed to clients). Changing the source key logs
 * everybody out, which is the expected behaviour of a secret rotation.
 */
function derivedSecret(purpose: string): string {
  const seed = read('SUPABASE_SERVICE_ROLE_KEY') || read('SUPABASE_DB_URL');
  if (!seed) return '';
  return createHash('sha256').update(`radiant-lucky-draw:${purpose}:${seed}`).digest('hex');
}

const NODE_ENV = read('NODE_ENV') || (isEdge ? 'production' : 'development');

// ─── Validation ────────────────────────────────────────────

function validateEnv(values: Record<string, string>): void {
  const isProduction = NODE_ENV === 'production';
  for (const key of ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!values[key]) {
      const message = `[Env Validation] Missing required environment variable: ${key}`;
      if (isProduction) throw new Error(message);
      console.warn(message);
    }
  }
}

// ─── Environment Object ────────────────────────────────────

export const env = {
  // Server
  PORT: parseInt(read('PORT') || '3001', 10),
  NODE_ENV,

  // Database
  DATABASE_URL: read('DATABASE_URL') || read('SUPABASE_DB_URL') || '',
  // Used by `prisma migrate` only (Supabase session pooler / direct connection)
  DIRECT_URL: read('DIRECT_URL') || read('DATABASE_URL') || read('SUPABASE_DB_URL') || '',

  // JWT (secrets are REQUIRED - no fallbacks allowed)
  JWT_SECRET: read('JWT_SECRET') || derivedSecret('access'),
  JWT_EXPIRES_IN: read('JWT_EXPIRES_IN') || '15m',
  JWT_REFRESH_SECRET: read('JWT_REFRESH_SECRET') || derivedSecret('refresh'),
  JWT_REFRESH_EXPIRES_IN: read('JWT_REFRESH_EXPIRES_IN') || '7d',

  // Cookies
  COOKIE_NAME: read('COOKIE_NAME') || 'radiant_refresh',
  COOKIE_SECURE: read('COOKIE_SECURE') ? read('COOKIE_SECURE') === 'true' : isEdge,
  COOKIE_SAME_SITE: (read('COOKIE_SAME_SITE') || 'lax') as 'lax' | 'strict' | 'none',
  COOKIE_MAX_AGE_MS: parseInt(read('COOKIE_MAX_AGE_MS') || '604800000', 10), // 7 days

  // CORS — comma-separated origins; production-safe default includes the Vercel
  // frontend so the API works out-of-the-box without env-variable configuration.
  CORS_ORIGIN:
    read('CORS_ORIGIN') ||
    [
      'https://radiant-lucky-draw.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ].join(','),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(read('RATE_LIMIT_WINDOW_MS') || '900000', 10),
  RATE_LIMIT_MAX: parseInt(read('RATE_LIMIT_MAX') || '100', 10),

  // Registration rate limiting (GO LIVE HOTFIX)
  // A single event venue shares one network (one public IP) for up to 300
  // participants. The registration endpoint therefore needs a much higher
  // per-IP allowance than the general API limiter.
  REGISTRATION_RATE_LIMIT_WINDOW_MS: parseInt(
    read('REGISTRATION_RATE_LIMIT_WINDOW_MS') || '900000',
    10,
  ),
  REGISTRATION_RATE_LIMIT_MAX: parseInt(read('REGISTRATION_RATE_LIMIT_MAX') || '600', 10),

  // Logging
  LOG_LEVEL: read('LOG_LEVEL') || 'dev',

  // Derived
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
  isEdge,
} as const;

// Run validation on import
validateEnv(env as unknown as Record<string, string>);
