/**
 * Analytics Tracking Service for Crewora Web
 * Standardizes event tracking for the application downloads.
 */

export interface DownloadEventData {
  source: string; // e.g. 'hero', 'navbar', 'footer', 'download_page'
  deviceType: 'desktop' | 'mobile_android' | 'mobile_ios' | 'unknown';
  timestamp: string;
  [key: string]: any;
}

export const analyticsService = {
  /**
   * Tracks when a user clicks any "Download App" CTA button.
   */
  trackDownloadClick(source: string, deviceType: string): void {
    const eventName = `${source}_download_click`;
    const payload: DownloadEventData = {
      source,
      deviceType: deviceType as any,
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics - Event: ${eventName}]`, payload);
    }

    // Integrate with window.gtag (Google Analytics) if configured
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        event_category: 'App Download',
        event_label: source,
        device_type: deviceType,
      });
    }
  },

  /**
   * Tracks when the actual file download begins.
   */
  trackDownloadStart(source: string): void {
    const payload = {
      source,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics - Event: download_start]', payload);
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'download_start', {
        event_category: 'App Download',
        event_label: source,
      });
    }
  },

  /**
   * Tracks when the file download succeeds (or completes initialization).
   */
  trackDownloadSuccess(source: string): void {
    const payload = {
      source,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics - Event: download_success]', payload);
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'download_success', {
        event_category: 'App Download',
        event_label: source,
      });
    }
  },

  /**
   * Tracks when a user scans the desktop QR Code.
   */
  trackQRCodeScan(): void {
    const payload = {
      source: 'qr_code',
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Analytics - Event: qr_download_scan]', payload);
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'qr_download_scan', {
        event_category: 'App Download',
        event_label: 'Desktop QR Code Scan',
      });
    }
  },
};
