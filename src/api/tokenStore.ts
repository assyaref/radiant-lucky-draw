/**
 * Access Token Store
 *
 * Holds the short-lived access token in memory only. The refresh
 * token is never stored on the client; it lives in an httpOnly
 * cookie managed by the server. Keeping the access token in memory
 * (rather than localStorage/sessionStorage) reduces XSS exposure.
 */

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}
