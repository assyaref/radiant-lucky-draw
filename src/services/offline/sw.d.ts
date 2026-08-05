// ============================================================
// Service Worker Type Declarations
// ============================================================
// These types are available in ServiceWorkerGlobalScope but not in standard DOM lib

interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<unknown>): void;
}

interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
  clientId: string;
  resultingClientId?: string;
  preloadResponse: Promise<unknown>;
}

interface ExtendableMessageEvent extends ExtendableEvent {
  data: unknown;
  origin: string;
  lastEventId: string;
  source: unknown;
  ports: ReadonlyArray<MessagePort>;
}

interface ServiceWorkerGlobalScope {
  skipWaiting(): void;
  clients: {
    claim(): Promise<void>;
  };
  addEventListener(type: 'install', listener: (event: ExtendableEvent) => void): void;
  addEventListener(type: 'activate', listener: (event: ExtendableEvent) => void): void;
  addEventListener(type: 'fetch', listener: (event: FetchEvent) => void): void;
  addEventListener(type: 'message', listener: (event: ExtendableMessageEvent) => void): void;
}
