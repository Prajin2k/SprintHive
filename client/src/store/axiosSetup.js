/**
 * Axios Interceptor Setup
 * Called once from main.jsx after store is created.
 * Captures store reference in closure — avoids circular imports.
 *
 * Request interceptor: attaches Bearer token from Redux state
 * Response interceptor: on 401, single-flight refresh → retry once
 */

import api from '../services/api';
import { refreshSession } from '../services/sessionRefresh';
import { setCredentials, clearAuth } from './slices/authSlice';

/** Prevent cascading window.location redirects when many requests fail refresh. */
let hasRedirectedToLogin = false;

const redirectToLoginOnce = () => {
  if (hasRedirectedToLogin) return;
  hasRedirectedToLogin = true;

  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/register')) return;

  window.location.assign('/login');
};

const isRefreshRequest = (config) => {
  const url = config?.url || '';
  return url.includes('/auth/refresh');
};

export const setupInterceptors = (store) => {
  // ── Request: attach access token from Redux state ─────────────
  api.interceptors.request.use(
    (config) => {
      const token = store.getState().auth.accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // ── Response: 401 → single-flight refresh → retry once ────────
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // No config (network abort etc.) or not a 401
      if (!originalRequest || error.response?.status !== 401) {
        return Promise.reject(error);
      }

      // Never try to refresh a failed refresh call — avoids loops
      if (isRefreshRequest(originalRequest)) {
        return Promise.reject(error);
      }

      // Already retried this request after a refresh — give up
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // All concurrent 401s share this one network call
        const data = await refreshSession();
        const newToken = data.accessToken;

        store.dispatch(
          setCredentials({ user: data.user, accessToken: newToken })
        );

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        store.dispatch(clearAuth());
        redirectToLoginOnce();
        return Promise.reject(refreshError);
      }
    }
  );
};
