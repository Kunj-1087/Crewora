/**
 * Auth Store — Zustand
 * Manages authentication state (user info, loading, error).
 * Access token is in tokenStore (memory), user info here.
 */

import { create } from 'zustand';
import { Customer, Worker } from '@/types';
import { tokenStore } from '@/lib/auth/tokenStore';
import apiClient from '@/lib/api/client';

type AuthUser = (Customer & { role: 'customer' }) | (Worker & { role: 'worker' }) | null;

interface AuthState {
  user: AuthUser;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  sendOtp: (phone: string, userType: 'customer' | 'worker') => Promise<string | undefined>;
  loginCustomer: (phone: string, otp: string) => Promise<void>;
  loginWorker: (phone: string, otp: string) => Promise<void>;
  registerCustomer: (data: {
    name: string;
    phone: string;
    otp: string;
  }) => Promise<void>;
  registerWorker: (data: {
    name: string;
    phone: string;
    tradeCategories: string[];
    city: string;
    otp: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<Customer | Worker>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  updateUser: (updates) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...updates } as AuthUser });
  },

  sendOtp: async (phone, userType) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post(`/auth/${userType}/send-otp`, { phone });
      set({ isLoading: false });
      return data.data?.otp; // In development mode, the OTP is returned for testing convenience.
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send OTP';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  loginCustomer: async (phone, otp) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/customer/login', { phone, otp });
      const { user, accessToken } = data.data;
      tokenStore.setToken(accessToken, 'customer');
      set({ user: { ...user, role: 'customer' }, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  loginWorker: async (phone, otp) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/worker/login', { phone, otp });
      const { user, accessToken } = data.data;
      tokenStore.setToken(accessToken, 'worker');
      set({ user: { ...user, role: 'worker' }, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  registerCustomer: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/customer/register', formData);
      const { user, accessToken } = data.data;
      tokenStore.setToken(accessToken, 'customer');
      set({ user: { ...user, role: 'customer' }, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  registerWorker: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/worker/register', formData);
      const { user, accessToken } = data.data;
      tokenStore.setToken(accessToken, 'worker');
      set({ user: { ...user, role: 'worker' }, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      const userType = tokenStore.getUserType();
      if (userType === 'customer') {
        await apiClient.post('/auth/customer/logout');
      } else if (userType === 'worker') {
        await apiClient.post('/auth/worker/logout');
      }
    } catch {
      // Ignore logout errors
    } finally {
      tokenStore.clearToken();
      set({ user: null });
    }
  },

  initializeAuth: async () => {
    // Try to silently refresh token on app load
    try {
      // Try customer first, then worker
      try {
        const { data } = await apiClient.post('/auth/customer/refresh', null, { timeout: 4000 });
        tokenStore.setToken(data.data.accessToken, 'customer');
        const profileRes = await apiClient.get('/customers/me', { timeout: 4000 });
        set({ user: { ...profileRes.data.data.customer, role: 'customer' }, isInitialized: true });
        return;
      } catch {
        // Not a customer session
      }

      try {
        const { data } = await apiClient.post('/auth/worker/refresh', null, { timeout: 4000 });
        tokenStore.setToken(data.data.accessToken, 'worker');
        const profileRes = await apiClient.get('/workers/me', { timeout: 4000 });
        set({ user: { ...profileRes.data.data.worker, role: 'worker' }, isInitialized: true });
        return;
      } catch {
        // Not a worker session
      }
    } catch {
      // No valid session
    }

    set({ isInitialized: true });
  },
}));
