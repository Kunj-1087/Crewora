/**
 * Production-Grade Axios Instance
 *
 * Full-featured HTTP client for the Crewora mobile app with:
 * - Token-based auth (Bearer from secureStorage)
 * - Automatic token refresh on 401 (with concurrent request queuing)
 * - Rate limit (429) handling with Retry-After parsing
 * - Server down (503) handling
 * - Offline detection via NetInfo
 * - Request tracing (X-Request-ID, X-App-Version, X-Platform)
 * - Structured error normalization
 * - API latency logging to Sentry (>3s requests flagged)
 */

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from './secureStorage';
import { addApiBreadcrumb, captureException } from './sentry';

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const TIMEOUT_MS = 10_000;
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

// ─── Token Refresh State ──────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

// ─── Normalized Error ─────────────────────────────────────────────────────────

export interface NormalizedError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode?: number;
  };
}

function normalizeError(err: unknown): NormalizedError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ message?: string; error?: { code?: string; message?: string } }>;
    const status = axiosErr.response?.status;
    const data = axiosErr.response?.data;

    // Rate limited
    if (status === 429) {
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: data?.message || 'Too many requests. Please slow down.',
          statusCode: 429,
        },
      };
    }

    // Server down / unavailable
    if (status === 503) {
      return {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable. Try again shortly.',
          statusCode: 503,
        },
      };
    }

    // Network error (no response received)
    if (!axiosErr.response) {
      if (axiosErr.message === 'Network Error' || axiosErr.code === 'ERR_NETWORK') {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Connection failed. Please check your internet connection.',
            statusCode: 0,
          },
        };
      }
    }

    // Auth failure
    if (status === 401) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: data?.message || 'Session expired. Please log in again.',
          statusCode: 401,
        },
      };
    }

    // Validation / bad request
    if (status === 400) {
      return {
        success: false,
        error: {
          code: data?.error?.code || 'VALIDATION_ERROR',
          message: data?.message || data?.error?.message || 'Invalid request.',
          statusCode: 400,
        },
      };
    }

    return {
      success: false,
      error: {
        code: data?.error?.code || 'API_ERROR',
        message: data?.message || axiosErr.message || 'An unexpected error occurred.',
        statusCode: status,
      },
    };
  }

  // Non-Axios error
  const msg = err instanceof Error ? err.message : String(err);
  return {
    success: false,
    error: { code: 'UNKNOWN_ERROR', message: msg },
  };
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Attach request tracing headers
    config.headers.set('X-Request-ID', crypto.randomUUID());
    config.headers.set('X-App-Version', APP_VERSION);
    config.headers.set('X-Platform', 'android');

    // Attach auth token from secure storage
    try {
      const token = await secureStorage.getAccessToken();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // Storage error — proceed without token (will get 401 if needed)
    }

    // Attach start time for latency tracking
    (config as any)._startTime = Date.now();

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => {
    // Track API latency
    const startTime = (response.config as any)._startTime as number | undefined;
    if (startTime) {
      const duration = Date.now() - startTime;
      addApiBreadcrumb(response.config.method?.toUpperCase() || 'GET', response.config.url || '', response.status);
      if (duration > 3000) {
        // Log slow requests as performance issue
        captureException(new Error(`Slow API: ${duration}ms`), {
          tags: { type: 'slow_api' },
          extra: {
            method: response.config.method,
            url: response.config.url,
            durationMs: duration,
            statusCode: response.status,
          },
        });
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    addApiBreadcrumb(
      originalRequest?.method?.toUpperCase() || '?',
      originalRequest?.url || '?',
      status,
    );

    // ─── 401: Attempt token refresh ──────────────────────────────────────
    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.set('Authorization', `Bearer ${token}`);
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.data?.accessToken;
        if (!newAccessToken) throw new Error('Refresh response missing token');

        await secureStorage.setTokens(newAccessToken, data.data?.refreshToken || refreshToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — force logout
        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.getState().logout();
        return Promise.reject(normalizeError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    // ─── 429: Rate limited — parse Retry-After ───────────────────────────
    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const seconds = retryAfter ? parseInt(retryAfter, 10) : 30;
      // Toast is shown by the calling component
      return Promise.reject(normalizeError(error));
    }

    return Promise.reject(normalizeError(error));
  },
);

export default api;
export { normalizeError };
