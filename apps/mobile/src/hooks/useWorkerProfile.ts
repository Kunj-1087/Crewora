'use client';

import { useProviderStore } from '@/store/useProviderStore';

/** Worker (provider) feed + own profile, delegating to the provider store. */
export function useWorkerProfile() {
  const feed = useProviderStore((s) => s.feed);
  const providerProfile = useProviderStore((s) => s.providerProfile);
  const loading = useProviderStore((s) => s.loading);
  const error = useProviderStore((s) => s.error);
  const fetchFeed = useProviderStore((s) => s.fetchFeed);
  const fetchProfile = useProviderStore((s) => s.fetchProfile);
  const setProviderProfile = useProviderStore((s) => s.setProviderProfile);

  return {
    feed,
    providerProfile,
    loading,
    error,
    fetchFeed,
    fetchProfile,
    setProviderProfile,
  };
}
