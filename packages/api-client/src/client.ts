/**
 * Axios API Client with JWT Interceptors
 * - Access token stored in memory only (tokenStore) — never localStorage
 * - Single-flight refresh queue — no duplicate refresh calls
 * - Separate refreshClient instance to prevent refresh loops
 */

import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from './tokenStore';

let API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

if (typeof window !== 'undefined') {
  // Check if running inside Capacitor native shell
  const isCapacitor = !!(window as any).Capacitor;
  
  if (isCapacitor) {
    if (process.env.NEXT_PUBLIC_API_URL) {
      API_BASE = process.env.NEXT_PUBLIC_API_URL;
    } else {
      // Fallback for local emulators: Android uses 10.0.2.2, iOS simulator uses localhost
      const platform = (window as any).Capacitor.getPlatform?.() || 'web';
      if (platform === 'android') {
        API_BASE = 'http://10.0.2.2:5000/api/v1';
      } else {
        API_BASE = 'http://localhost:5000/api/v1';
      }
    }
  } else {
    // If accessing from localhost in the web browser, route API requests to localhost directly (only in development)
    if (
      process.env.NODE_ENV !== 'production' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      API_BASE = 'http://localhost:5000/api/v1';
    }
  }
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// ─── Separate Refresh Client (no interceptors — prevents loops) ───────────────

const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request Interceptor — attach access token ────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Refresh Queue ────────────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// ─── Response Interceptor — auto-refresh on 401 ───────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isAuthRequest = originalRequest?.url?.includes('/auth/') || false;

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const userType = tokenStore.getUserType();
        const endpoint = userType === 'worker'
          ? '/auth/worker/refresh'
          : '/auth/customer/refresh';

        const { data } = await refreshClient.post(endpoint);
        const newToken = data.data.accessToken;

        tokenStore.setToken(newToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStore.clearToken();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
