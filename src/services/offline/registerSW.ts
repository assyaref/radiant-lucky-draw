// ============================================================
// Service Worker Registration
// ============================================================

export async function registerServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    console.log('[SW] Registered successfully:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('[SW] New version available');
            dispatchSWEvent('new-version', { registration });
          }
        });
      }
    });

    // Handle controller change (page refresh after update)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[SW] Controller changed, reloading...');
        window.location.reload();
      }
    });

    return true;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return false;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('[SW] Unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('[SW] Unregister failed:', error);
    return false;
  }
}

export async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ?? null;

}

export async function updateServiceWorker(): Promise<void> {
  const registration = await getSWRegistration();
  if (registration) {
    await registration.update();
  }
}

export async function sendSWMessage(message: unknown): Promise<void> {
  const registration = await getSWRegistration();
  if (registration?.active) {
    registration.active.postMessage(message);
  }
}

// ─── Event System ────────────────────────────────────────────

type SWEventCallback = (detail: unknown) => void;
const swEventListeners = new Map<string, Set<SWEventCallback>>();

export function onSWEvent(event: string, callback: SWEventCallback): () => void {
  if (!swEventListeners.has(event)) {
    swEventListeners.set(event, new Set());
  }
  swEventListeners.get(event)!.add(callback);
  return () => swEventListeners.get(event)?.delete(callback);
}

function dispatchSWEvent(event: string, detail: unknown): void {
  swEventListeners.get(event)?.forEach((callback) => {
    try {
      callback(detail);
    } catch (error) {
      console.error(`[SW] Error in event listener for ${event}:`, error);
    }
  });
}
