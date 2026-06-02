import { analyticsService } from './analyticsService';

export interface AppMetadata {
  version: string;
  releaseDate: string;
  apkSize: string;
  minAndroidVersion: string;
}

export const appDownloadService = {
  /**
   * Fetches application metadata from configured environment variables.
   */
  getMetadata(): AppMetadata {
    return {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      releaseDate: process.env.NEXT_PUBLIC_APP_RELEASE_DATE || 'June 2, 2026',
      apkSize: process.env.NEXT_PUBLIC_APK_SIZE || '15.4 MB',
      minAndroidVersion: process.env.NEXT_PUBLIC_MIN_ANDROID_VERSION || 'Android 8.0 (Oreo) or higher',
    };
  },

  /**
   * Resolves the target download/installation URL.
   * If a Play Store URL is configured, it takes priority. Otherwise, defaults to direct APK link.
   */
  getAndroidDownloadUrl(): string {
    const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL;
    if (playStoreUrl && playStoreUrl.trim() !== '') {
      return playStoreUrl;
    }
    return process.env.NEXT_PUBLIC_ANDROID_APK_URL || '';
  },

  /**
   * Checks whether the current config redirects users to Google Play Store.
   */
  isPlayStoreRedirect(): boolean {
    const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL;
    return !!(playStoreUrl && playStoreUrl.trim() !== '');
  },

  /**
   * Executes the download process safely.
   */
  async downloadAndroidApp(source: string): Promise<{ success: boolean; error?: string }> {
    const targetUrl = this.getAndroidDownloadUrl();

    if (!targetUrl) {
      return {
        success: false,
        error: 'Download URL is not configured in the application environment.',
      };
    }

    // Safety validation: Prevent malicious redirects by validating URL protocols
    try {
      const isAbsolute = targetUrl.startsWith('http://') || targetUrl.startsWith('https://');
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
      const parsedUrl = new URL(targetUrl, isAbsolute ? undefined : origin);
      
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Forbidden protocol');
      }
    } catch (e) {
      return {
        success: false,
        error: 'The configured download link is invalid or insecure.',
      };
    }

    analyticsService.trackDownloadStart(source);

    try {
      if (this.isPlayStoreRedirect()) {
        // Open Play Store in a new tab
        if (typeof window !== 'undefined') {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        // Trigger direct file download
        if (typeof window !== 'undefined') {
          const link = document.createElement('a');
          link.href = targetUrl;
          link.setAttribute('download', `crewora-v${this.getMetadata().version}.apk`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      
      analyticsService.trackDownloadSuccess(source);
      return { success: true };
    } catch (err: any) {
      console.error('App download failed:', err);
      return {
        success: false,
        error: 'Failed to start download. Check your network connection and try again.',
      };
    }
  }
};
