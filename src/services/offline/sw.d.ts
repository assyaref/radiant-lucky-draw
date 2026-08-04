// ============================================================
// Service Worker Type Declarations
// ============================================================
// These types are available in ServiceWorkerGlobalScope but not in standard DOM lib

interface ExtendableEvent extends Event {
  waitUntil(fn: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
  clientId: string;
  resultingClientId?: string;
  preloadResponse: Promise<any>;
}

interface ExtendableMessageEvent extends ExtendableEvent {
  data: any;
  origin: string;
  lastEventId: string;
  source: any;
  ports: ReadonlyArray<MessagePort>;
}
