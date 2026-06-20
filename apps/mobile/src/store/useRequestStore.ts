/**
 * Request (Job) store — Zustand.
 *
 * Wraps the existing /jobs endpoints with cached state, per-action loading/error,
 * and retry. Endpoints and response shapes are unchanged from the screens that
 * previously fetched inline (data.data.jobs / data.data.job / data.data.matches).
 */

import { create } from 'zustand';
import type { Job, Match } from '@crewora/shared';
import apiClient from '@crewora/api-client';
import { normalizeError, withRetry, type NormalizedError } from '@/lib/api/errors';
import type { CreateJobInput } from '@/validators';

interface RequestState {
  jobs: Job[];
  currentJob: Job | null;
  matches: Match[];
  loading: boolean;
  error: NormalizedError | null;

  fetchJobs: () => Promise<void>;
  fetchJobDetail: (jobId: string) => Promise<void>;
  createJob: (payload: CreateJobInput) => Promise<Job>;
  invalidate: () => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  jobs: [],
  currentJob: null,
  matches: [],
  loading: false,
  error: null,

  fetchJobs: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await withRetry(() => apiClient.get('/jobs'));
      set({ jobs: data.data.jobs || [], loading: false });
    } catch (err) {
      set({ error: normalizeError(err), loading: false });
    }
  },

  fetchJobDetail: async (jobId) => {
    set({ loading: true, error: null });
    try {
      const [jobRes, matchesRes] = await Promise.all([
        withRetry(() => apiClient.get(`/jobs/${jobId}`)),
        withRetry(() => apiClient.get(`/jobs/${jobId}/matches`)),
      ]);
      set({
        currentJob: jobRes.data.data.job,
        matches: matchesRes.data.data.matches || [],
        loading: false,
      });
    } catch (err) {
      set({ error: normalizeError(err), loading: false });
    }
  },

  createJob: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post('/jobs', payload);
      const job: Job = data.data.job;
      set((state) => ({ jobs: [job, ...state.jobs], loading: false }));
      return job;
    } catch (err) {
      const error = normalizeError(err);
      set({ error, loading: false });
      throw err;
    }
  },

  invalidate: () => set({ jobs: [], currentJob: null, matches: [], error: null }),
}));
