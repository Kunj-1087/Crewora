/**
 * Non-sensitive UI Preferences Storage
 *
 * Uses localStorage for UI-only state that carries no security risk.
 * In SSR (server-side rendering), all operations are no-ops.
 * NEVER store tokens, user IDs, or any PII here — those go in secureStorage.
 *
 * Persisted values:
 *   theme             — 'light' | 'dark' | 'system'
 *   onboarding_seen   — 'true' | undefined (boolean)
 *   notif_permission_asked — 'true' | undefined (boolean)
 *   lang_preference   — 'en' | 'gu'
 *   update_check_ts   — ISO timestamp of last OTA update check (for cooldown)
 */

interface StorageSchema {
  theme: 'light' | 'dark' | 'system';
  onboarding_seen: boolean;
  notif_permission_asked: boolean;
  lang_preference: 'en' | 'gu';
}

const KEYS: Record<keyof StorageSchema, string> = {
  theme: 'ui_theme',
  onboarding_seen: 'ui_onboarding_seen',
  notif_permission_asked: 'ui_notif_permission_asked',
  lang_preference: 'ui_lang_preference',
};

function getStore(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null; // SSR — no browser storage available
}

const store = getStore();

export const uiStorage = {
  get<K extends keyof StorageSchema>(key: K): StorageSchema[K] | null {
    if (!store) return null;
    try {
      const raw = store.getItem(KEYS[key]);
      if (raw === null) return null;
      return JSON.parse(raw) as StorageSchema[K];
    } catch {
      return null;
    }
  },

  set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): void {
    if (!store) return;
    try {
      store.setItem(KEYS[key], JSON.stringify(value));
    } catch {
      // Storage full or quota exceeded — silently ignore
    }
  },

  remove<K extends keyof StorageSchema>(key: K): void {
    if (!store) return;
    try {
      store.removeItem(KEYS[key]);
    } catch {
      // Silently ignore
    }
  },

  /** Clear all UI preferences. */
  clearAll(): void {
    if (!store) return;
    try {
      for (const k of Object.values(KEYS)) {
        store.removeItem(k);
      }
    } catch {
      // Silently ignore
    }
  },
};
