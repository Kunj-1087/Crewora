/**
 * API error normalization + retry helpers.
 *
 * The shared @crewora/api-client already handles JWT attach and 401 refresh; these
 * helpers sit on top so stores/hooks/screens get a single, consistent error shape
 * and opt-in retry for transient network failures (spec §5 API layer).
 */

import { AxiosError } from 'axios';

export interface NormalizedError {
  message: string;
  code: string;
}

/** Default per-attempt timeout for retried requests (spec: 10s). */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Convert any thrown value into a stable `{ message, code }` shape. */
export function normalizeError(error: unknown): NormalizedError {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; code?: string }
      | undefined;

    if (error.code === 'ECONNABORTED') {
      return { message: 'The request timed out. Please try again.', code: 'TIMEOUT' };
    }
    if (error.response) {
      return {
        message: data?.message || defaultMessageForStatus(error.response.status),
        code: data?.code || `HTTP_${error.response.status}`,
      };
    }
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    };
  }

  if (error instanceof Error) {
    return { message: error.message, code: 'UNKNOWN' };
  }
  return { message: 'Something went wrong. Please try again.', code: 'UNKNOWN' };
}

function defaultMessageForStatus(status: number): string {
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return 'Not found.';
  if (status >= 500) return 'Our servers are having trouble. Please try again shortly.';
  return 'Request failed. Please try again.';
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as AxiosError).isAxiosError === true
  );
}

/** True for transient failures worth retrying (timeout / no response / 5xx). */
function isRetryable(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  if (error.code === 'ECONNABORTED') return true; // timeout
  if (!error.response) return true; // network / no response
  return error.response.status >= 500;
}

export interface RetryOptions {
  retries?: number;
  /** Base backoff in ms; doubles each attempt. */
  backoffMs?: number;
}

/**
 * Run an async request with exponential-backoff retry on transient errors.
 * Non-retryable errors (4xx, validation) reject immediately.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, backoffMs = 400 }: RetryOptions = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isRetryable(error)) break;
      await delay(backoffMs * 2 ** attempt);
    }
  }
  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
