/**
 * Provider (Worker) store — Zustand.
 *
 * Wraps the worker job feed and the worker's own profile. Endpoints/shapes match
 * the worker dashboard and profile screens (/jobs/worker/feed, /workers/me).
 */

import { create } from 'zustand';
import type { Job, Worker } from '@crewora/shared';
import apiClient from '@crewora/api-client';
import { normalizeError, withRetry, type NormalizedError } from '@/lib/api/errors';

type FeedStatus = 'pending' | 'accepted';

interface ProviderState {
  feed: Job[];
  providerProfile: Worker | null;
  loading: boolean;
  error: NormalizedError | null;

  fetchFeed: (status: FeedStatus) => Promise<void>;
  fetchProfile: () => Promise<void>;
  setProviderProfile: (worker: Worker) => void;
}

export const useProviderStore = create<ProviderState>((set) => ({
  feed: [],
  providerProfile: null,
  loading: false,
  error: null,

  fetchFeed: async (status) => {
    set({ loading: true, error: null });
    try {
      const { data } = await withRetry(() =>
        apiClient.get('/jobs/worker/feed', { params: { status } })
      );
      set({ feed: data.data.jobs || [], loading: false });
    } catch (err) {
      set({ error: normalizeError(err), loading: false });
    }
  },

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await withRetry(() => apiClient.get('/workers/me'));
      set({ providerProfile: data.data.worker, loading: false });
    } catch (err) {
      set({ error: normalizeError(err), loading: false });
    }
  },

  setProviderProfile: (worker) => set({ providerProfile: worker }),
}));
