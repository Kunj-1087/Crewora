/**
 * Secure Token & User Storage
 *
 * Uses Capacitor Preferences (encrypted storage on Android) for all sensitive data.
 * AsyncStorage is NEVER used for tokens, user IDs, or roles.
 *
 * Keys:
 *   crewora_access_token  — JWT access token
 *   crewora_refresh_token — JWT refresh token
 *   crewora_user_meta     — { userId, role } serialized as JSON
 *
 * Every get/set is wrapped in try/catch — storage failures never crash the app.
 * Errors are logged without the value — only key name and error message.
 */

import { Preferences } from '@capacitor/preferences';
import { logger } from './logger';

const KEYS = {
  ACCESS_TOKEN: 'crewora_access_token',
  REFRESH_TOKEN: 'crewora_refresh_token',
  USER_META: 'crewora_user_meta',
} as const;

interface UserMeta {
  userId: string;
  role: 'customer' | 'worker' | 'admin';
}

function logStorageError(key: string, operation: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  logger.warn(`[secureStorage] ${operation} failed for key "${key}"`, { message });
}

export const secureStorage = {
  /** Store both access and refresh tokens in parallel. */
  setTokens: async (access: string, refresh: string): Promise<void> => {
    try {
      await Promise.all([
        Preferences.set({ key: KEYS.ACCESS_TOKEN, value: access }),
        Preferences.set({ key: KEYS.REFRESH_TOKEN, value: refresh }),
      ]);
    } catch (err) {
      logStorageError(KEYS.ACCESS_TOKEN, 'setTokens', err);
    }
  },

  getAccessToken: async (): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key: KEYS.ACCESS_TOKEN });
      return value ?? null;
    } catch (err) {
      logStorageError(KEYS.ACCESS_TOKEN, 'getAccessToken', err);
      return null;
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key: KEYS.REFRESH_TOKEN });
      return value ?? null;
    } catch (err) {
      logStorageError(KEYS.REFRESH_TOKEN, 'getRefreshToken', err);
      return null;
    }
  },

  /** Persist user ID and role as a JSON string. */
  setUserMeta: async (userId: string, role: UserMeta['role']): Promise<void> => {
    try {
      const meta: UserMeta = { userId, role };
      await Preferences.set({ key: KEYS.USER_META, value: JSON.stringify(meta) });
    } catch (err) {
      logStorageError(KEYS.USER_META, 'setUserMeta', err);
    }
  },

  /** Retrieve user meta. Returns null if missing or corrupt. */
  getUserMeta: async (): Promise<UserMeta | null> => {
    try {
      const { value } = await Preferences.get({ key: KEYS.USER_META });
      if (!value) return null;
      const parsed = JSON.parse(value) as UserMeta;
      if (
        typeof parsed.userId !== 'string' ||
        !['customer', 'worker', 'admin'].includes(parsed.role)
      ) {
        return null;
      }
      return parsed;
    } catch (err) {
      logStorageError(KEYS.USER_META, 'getUserMeta', err);
      return null;
    }
  },

  /** Clear ALL crewora_* keys — call on logout. */
  clearAll: async (): Promise<void> => {
    try {
      await Promise.all([
        Preferences.remove({ key: KEYS.ACCESS_TOKEN }),
        Preferences.remove({ key: KEYS.REFRESH_TOKEN }),
        Preferences.remove({ key: KEYS.USER_META }),
      ]);
    } catch (err) {
      logStorageError('all', 'clearAll', err);
    }
  },
};
