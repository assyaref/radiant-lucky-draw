/**
 * Environment Configuration
 *
 * Centralized environment variable access with validation.
 * All VITE_ prefixed variables are exposed to the client.
 */

// ─── Validation ────────────────────────────────────────────

function validateEnv(): void {
  const required: string[] = ['VITE_API_BASE_URL'];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    if (import.meta.env.PROD) {
      console.error(
        `[Env Validation] Missing required environment variables:\n  ${missing.join('\n  ')}`,
      );
    } else {
      console.warn(
        `[Env Validation] Missing environment variables (using defaults):\n  ${missing.join('\n  ')}`,
      );
    }
  }
}

// ─── Environment Object ────────────────────────────────────

export const env = {
  // App
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Radiant Lucky Draw',

  // Public URL (used for QR registration link)
  PUBLIC_URL: import.meta.env.VITE_PUBLIC_URL || 'http://localhost:5173',

  // API
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),

  // Realtime (Socket.IO)
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',

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
