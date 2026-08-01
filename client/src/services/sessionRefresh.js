/**
 * Single-flight session refresh.
 *
 * All callers (axios 401 interceptor, initAuth, manual refresh) share ONE
 * in-flight POST /auth/refresh. Concurrent waiters await the same promise
 * instead of rotating the refresh cookie multiple times (which triggers
 * server-side reuse detection and wipes the session).
 */
import axios from 'axios';

/** @type {Promise<{ accessToken: string, user: object }> | null} */
let refreshPromise = null;

/**
 * Refresh the session via the httpOnly cookie.
 * Returns the refresh response body: { accessToken, user, ... }
 */
export function refreshSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axios
    .post('/api/auth/refresh', {}, { withCredentials: true })
    .then((res) => res.data)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/** True while a refresh network call is in flight (for tests / debugging). */
export function isRefreshInFlight() {
  return refreshPromise !== null;
}
