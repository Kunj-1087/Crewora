'use client';

import { useRequestStore } from '@/store/useRequestStore';

/**
 * Customer-facing job data. Thin wrapper over the request store so screens stay
 * declarative (no fetch logic in the component body). Screens own when to call
 * `fetchJobs`/`fetchJobDetail` (e.g. inside an auth-gated effect).
 */
export function useJobs() {
  const jobs = useRequestStore((s) => s.jobs);
  const currentJob = useRequestStore((s) => s.currentJob);
  const matches = useRequestStore((s) => s.matches);
  const loading = useRequestStore((s) => s.loading);
  const error = useRequestStore((s) => s.error);
  const fetchJobs = useRequestStore((s) => s.fetchJobs);
  const fetchJobDetail = useRequestStore((s) => s.fetchJobDetail);
  const createJob = useRequestStore((s) => s.createJob);
  const invalidate = useRequestStore((s) => s.invalidate);

  return {
    jobs,
    currentJob,
    matches,
    loading,
    error,
    fetchJobs,
    fetchJobDetail,
    createJob,
    invalidate,
  };
}
