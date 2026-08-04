// ============================================================
// Service Worker for Offline Support
// ============================================================
// @ts-nocheck - This file runs in ServiceWorkerGlobalScope, not Window
// It is compiled separately by Vite for the Service Worker context.

const CACHE_NAME = 'radiant-lucky-draw-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
];

const API_CACHE_NAME = 'radiant-api-v1';
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Install ─────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE_NAME, API_CACHE_TTL));
    return;
  }

  // Static assets - Cache first, network fallback
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstWithNetwork(request));
    return;
  }

  // Navigation requests - Network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithCache(request, CACHE_NAME));
    return;
  }

  // Default - Network only
  event.respondWith(fetch(request));
});

// ─── Strategies ──────────────────────────────────────────────

async function networkFirstWithCache(request, cacheName, ttl) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const clonedResponse = response.clone();
      
      if (ttl) {
        // Store with timestamp for TTL checking
        const headers = new Headers(clonedResponse.headers);
        headers.set('x-cache-timestamp', Date.now().toString());
        const modifiedResponse = new Response(clonedResponse.body, {
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          headers,
        });
        cache.put(request, modifiedResponse);
      } else {
        cache.put(request, clonedResponse);
      }
    }

    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Check TTL for API cache
      if (ttl) {
        const cacheTimestamp = cached.headers.get('x-cache-timestamp');
        if (cacheTimestamp && Date.now() - parseInt(cacheTimestamp) > ttl) {
          // Cache expired, return stale but don't block
          return cached;
        }
      }
      return cached;
    }

    // Return offline fallback for navigation
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function cacheFirstWithNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function isStaticAsset(url) {
  const extensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  return extensions.some((ext) => url.pathname.endsWith(ext));
}

// ─── Message Handling ────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
    caches.delete(API_CACHE_NAME);
  }

  if (event.data?.type === 'CACHE_STATUS') {
    event.ports[0]?.postMessage({
      cacheName: CACHE_NAME,
      apiCacheName: API_CACHE_NAME,
    });
  }
});

export {};
