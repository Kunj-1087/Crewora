'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/api/client';
import en from '@/constants/translations/en.json';
import gu from '@/constants/translations/gu.json';

const translations: Record<'en' | 'gu', any> = { en, gu };

type LanguageType = 'en' | 'gu';

interface LanguageContextProps {
  language: LanguageType;
  changeLanguage: (lang: LanguageType) => Promise<void>;
  t: (key: string, variables?: Record<string, string | number>) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized, updateUser } = useAuthStore();
  const [language, setLanguageState] = useState<LanguageType>('en');
  const [loading, setLoading] = useState(true);

  // Helper to extract nested trans keys
  const t = (path: string, variables?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let value: any = translations[language];
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return path;
      }
    }
    if (typeof value !== 'string') return path;
    if (variables) {
      return Object.entries(variables).reduce((str, [k, val]) => {
        return str.replace(new RegExp(`{${k}}`, 'g'), String(val));
      }, value);
    }
    return value;
  };

  // Internal language state setter that also updates axios headers and localStorage
  const updateLanguageConfigs = (lang: LanguageType) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crewora_lang', lang);
    }
    apiClient.defaults.headers.common['Accept-Language'] = lang;
  };

  // Initialize language detection
  useEffect(() => {
    async function detectLanguage() {
      // 1. Check if user has saved preference in database (via Zustand authStore)
      if (isInitialized && user && user.languagePreference) {
        updateLanguageConfigs(user.languagePreference as LanguageType);
        setLoading(false);
        return;
      }

      // 2. Check localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('crewora_lang');
        if (stored === 'en' || stored === 'gu') {
          updateLanguageConfigs(stored);
          setLoading(false);
          return;
        }
      }

      // 3. Detect Device Language (Capacitor native check for Android)
      let detected: LanguageType = 'en';
      try {
        const { DeviceLanguage } = await import('@/lib/capacitor/DeviceLanguage');
        const res = await DeviceLanguage.getLanguage();
        if (res.languageTag.startsWith('gu') || res.language.startsWith('gu')) {
          detected = 'gu';
        }
      } catch {
        // Fallback: Check browser languages
        if (typeof navigator !== 'undefined') {
          const browserLangs = navigator.languages || [navigator.language];
          const isGu = browserLangs.some(l => l.startsWith('gu'));
          if (isGu) {
            detected = 'gu';
          }
        }
      }

      updateLanguageConfigs(detected);
      setLoading(false);

      // If user is logged in but has no preference in DB, sync the detected language
      if (isInitialized && user && !user.languagePreference) {
        try {
          await apiClient.post('/user/language', { language: detected });
          updateUser({ languagePreference: detected });
        } catch (e) {
          console.error('Failed to sync auto-detected language to database:', e);
        }
      }
    }

    detectLanguage();
  }, [isInitialized, user?.id]); // Run when auth initialization status or user changes

  // Expose manual language switcher
  const changeLanguage = async (lang: LanguageType) => {
    updateLanguageConfigs(lang);
    if (user) {
      try {
        await apiClient.post('/user/language', { language: lang });
        updateUser({ languagePreference: lang });
      } catch (e) {
        console.error('Failed to save language preference to database:', e);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
