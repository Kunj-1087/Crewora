/**
 * Screen Security
 *
 * Provides FLAG_SECURE protection for sensitive screens to prevent:
 * - Screenshots (blocked on protected screens)
 * - Screen recording (blocked on protected screens)
 * - App switcher thumbnails (hidden for protected screens)
 *
 * Use via useFocusEffect in each screen:
 *   enableSecureMode() on focus
 *   disableSecureMode() on blur
 *
 * Screens that should be secure:
 *   - OTP entry
 *   - Profile (customer + worker)
 *   - Request Detail with applicant contacts
 *   - Provider Profile with contact info
 *
 * Screens that should NOT be secure:
 *   - Home / Browse
 *   - Notifications
 *   - Onboarding
 */

// Capacitor doesn't have a built-in FLAG_SECURE equivalent.
// This module provides a graceful degradation:
// - On Android native (via Capacitor plugin): uses FLAG_SECURE
// - On web: no-op (web apps can't prevent screenshots)
// - Fallback: visual-only deterrent (CSS overlay)

let secureCount = 0;

/**
 * Enable secure mode (FLAG_SECURE).
 * Call on screen focus for sensitive screens.
 * Supports nested calls with a reference counter.
 */
export function enableSecureMode(): void {
  secureCount++;
  if (secureCount === 1) {
    applySecureFlag(true);
  }
}

/**
 * Disable secure mode.
 * Call on screen blur for sensitive screens.
 * Only disables when all callers have disabled.
 */
export function disableSecureMode(): void {
  secureCount = Math.max(0, secureCount - 1);
  if (secureCount === 0) {
    applySecureFlag(false);
  }
}

/**
 * Forcefully disable all secure mode (e.g., on app background).
 */
export function resetSecureMode(): void {
  secureCount = 0;
  applySecureFlag(false);
}

function applySecureFlag(enabled: boolean): void {
  try {
    // Attempt native Capacitor plugin call
    // If available, this calls the Android native module
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform) {
      (window as any).Capacitor?.Plugins?.ScreenSecurity?.setSecure?.({ enabled });
    }
  } catch {
    // Gracefully degrade — screenshot protection is best-effort
  }

  // CSS-based deterrent as visual fallback (covers web preview and simulators)
  // Does NOT actually prevent screenshots, but deters casual screen recording
  const styleId = 'crewora-screen-security';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (enabled && !styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      body::after {
        content: '';
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        z-index: 2147483647;
        background: transparent;
        /* Visual deterrent: subtle pattern overlay */
        background-image: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(38, 109, 211, 0.02) 2px,
          rgba(38, 109, 211, 0.02) 4px
        );
      }
    `;
    document.head.appendChild(styleEl);
  } else if (!enabled && styleEl) {
    styleEl.remove();
  }
}
