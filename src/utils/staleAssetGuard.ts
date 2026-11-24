/**
 * Stale asset guard
 *
 * Every deploy produces new hashed files in /assets. A tab opened (or a page
 * cached) around a deploy can reference files the server no longer has: the
 * stylesheet fails and the app renders unstyled, or a lazy route chunk fails
 * to load. When that happens, reload once to pick up the current index.html.
 * A short sessionStorage guard prevents reload loops.
 */

const KEY = 'radiant:stale-asset-reload';
const WINDOW_MS = 30_000;

function reloadOnce(reason: string): void {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < WINDOW_MS) return;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* storage unavailable: still reload once per page life */
  }
  console.warn(`[stale-asset] ${reason} — reloading`);
  window.location.reload();
}

function appStylesheets(): HTMLLinkElement[] {
  return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).filter(
    (l) => l.href.includes('/assets/'),
  );
}

export function installStaleAssetGuard(): void {
  // Lazy route chunk / CSS preload failed (Vite emits this event).
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnce('chunk preload failed');
  });

  // A stylesheet that errors after this point.
  document.addEventListener(
    'error',
    (event) => {
      const t = event.target as HTMLElement | null;
      if (t instanceof HTMLLinkElement && t.rel === 'stylesheet' && t.href.includes('/assets/')) {
        reloadOnce(`stylesheet failed: ${t.href}`);
      }
    },
    true,
  );

  // A stylesheet that already failed before the app booted.
  // Browsers keep an empty sheet (0 rules) for a stylesheet that failed to load.
  const isBroken = (l: HTMLLinkElement) => {
    if (!l.sheet) return true;
    try {
      return l.sheet.cssRules.length === 0;
    } catch {
      return false; // not readable (cross-origin): assume fine
    }
  };
  const check = () => {
    if (appStylesheets().some(isBroken)) reloadOnce('stylesheet missing');
  };
  if (document.readyState === 'complete') check();
  else window.addEventListener('load', check, { once: true });
}
