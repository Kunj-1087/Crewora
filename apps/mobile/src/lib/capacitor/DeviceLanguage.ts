import { registerPlugin } from '@capacitor/core';

export interface DeviceLanguagePlugin {
  getLanguage(): Promise<{
    language: string;
    country: string;
    languageTag: string;
  }>;
  checkPushConfig(): Promise<{
    isDummy: boolean;
  }>;
}

export const DeviceLanguage = registerPlugin<DeviceLanguagePlugin>('DeviceLanguage');
