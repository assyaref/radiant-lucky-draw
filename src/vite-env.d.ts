/// <reference types="vite/client" />

// ─── Environment Variables ──────────────────────────────────

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_PUBLIC_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_ENABLE_MOCK: string;
  readonly VITE_ENABLE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ─── Global Constants ───────────────────────────────────────

declare const __APP_VERSION__: string;
