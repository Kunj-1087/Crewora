import { registerPlugin } from '@capacitor/core';

export interface DeviceLanguagePlugin {
  getLanguage(): Promise<{
    language: string;
    country: string;
    languageTag: string;
  }>;
}

export const DeviceLanguage = registerPlugin<DeviceLanguagePlugin>('DeviceLanguage');
