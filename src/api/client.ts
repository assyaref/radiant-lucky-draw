/**
 * API Client
 *
 * Thin fetch wrapper with credentials (cookies) enabled so the
 * httpOnly refresh token cookie is sent automatically. Handles
 * JSON serialization, timeouts, and normalized error responses.
 *
 * The client attaches the in-memory access token as a Bearer
 * Authorization header on every request. On a 401 response it
 * attempts a single refresh via /auth/refresh, updates the token,
 * and retries the original request once.
 */

import { env } from '@config/env';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    expiresIn: number;
    user: unknown;
  };
}

// Guards against concurrent refresh storms and infinite retry loops.
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${env.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        clearAccessToken();
        return null;
      }

      const payload = (await response.json()) as RefreshResponse;
      const token = payload?.data?.accessToken ?? null;
      setAccessToken(token);
      return token;
    } catch {
      clearAccessToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { method = 'GET', body, headers, signal } = options;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), env.API_TIMEOUT);

  // Combine external signal with timeout signal
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  const accessToken = getAccessToken();

  try {
    const response = await fetch(`${env.API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    // On 401, attempt a single refresh + retry (unless this is already a retry).
    if (response.status === 401 && !isRetry) {
      const newToken = await performRefresh();
      if (newToken) {
        return request<T>(path, options, true);
      }
    }

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        code: payload?.error?.code ?? 'REQUEST_FAILED',
        message: payload?.error?.message ?? 'Request failed',
        details: payload?.error?.details,
      };
      throw new ApiClientError(error);
    }

    return payload as T;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiClientError({
        status: 0,
        code: 'TIMEOUT',
        message: 'Request timed out',
      });
    }
    throw new ApiClientError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the server',
    });
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export default api;
