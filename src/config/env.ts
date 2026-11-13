/**
 * Environment Configuration
 *
 * Centralized environment variable access with validation.
 * All VITE_ prefixed variables are exposed to the client.
 *
 * Production-safe defaults:
 * - In production, if a VITE_ variable is not provided, the app falls back
 *   to the deployed Railway backend so it never points at localhost.
 * - In development, localhost fallbacks are used for local tooling.
 */

// ─── Production Defaults ────────────────────────────────────────────────
// Single source of truth for the deployed backend. These are used ONLY as
// a fallback when the corresponding VITE_ variable is not set at build time.
const PRODUCTION_API_URL = 'https://radiant-lucky-draw.vercel.app';
// Supabase project (public values — the anon/publishable key is designed to be
// shipped to browsers; every table is protected by RLS and the app only uses
// it for Realtime broadcast). Override with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
const DEFAULT_SUPABASE_URL = 'https://emwmnghbxsoudfxxltna.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_1rcvks3PA63JAOEvfP9uPg_zjTuvcKR';
const PRODUCTION_PUBLIC_URL = 'https://radiant-lucky-draw.vercel.app';

// ─── API Base URL Normalization ─────────────────────────────────────────
// The backend mounts every route under the `/api` prefix (e.g. `/api/auth/login`).
// This helper guarantees `API_BASE_URL` always ends with `/api` regardless of
// whether the VITE_ variable was provided with or without the prefix. It also
// strips any trailing slash so concatenation with request paths is safe.
function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

// ─── Validation ─────────────────────────────────────────────────────────

function validateEnv(): void {
  const required: string[] = ['VITE_API_BASE_URL'];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    if (import.meta.env.PROD) {
      console.error(
        `[Env Validation] Missing required environment variables (using production defaults):\n  ${missing.join(
          '\n  ',
        )}`,
      );
    } else {
      console.warn(
        `[Env Validation] Missing environment variables (using defaults):\n  ${missing.join(
          '\n  ',
        )}`,
      );
    }
  }
}

// ─── Environment Object ─────────────────────────────────────────────────

export const env = {
  // App
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Radiant Lucky Draw',

  // Public URL (used for QR registration link)
  PUBLIC_URL:
    import.meta.env.VITE_PUBLIC_URL ||
    (import.meta.env.PROD ? PRODUCTION_PUBLIC_URL : 'http://localhost:5173'),

  // API
  API_BASE_URL: normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? PRODUCTION_API_URL : '/api'),
  ),
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),

  // Realtime (Supabase Realtime broadcast — replaces Socket.IO)
  SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/+$/, ''),
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  /** @deprecated kept for existing call sites; equals SUPABASE_URL */
  SOCKET_URL: (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/+$/, ''),

  // Features
  ENABLE_MOCK: import.meta.env.VITE_ENABLE_MOCK === 'true',
  ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',

  // Build info
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,

  // Version (from package.json)
  APP_VERSION: __APP_VERSION__ || '0.0.0',
} as const;

// Run validation on import
validateEnv();

export default env;
