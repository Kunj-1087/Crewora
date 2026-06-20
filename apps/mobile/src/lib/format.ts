/** Display/formatting helpers shared across screens. */

/**
 * Mask a phone number for display, keeping the country hint and last digits.
 * e.g. "9876543210" → "+91 98xxx xx210"
 */
export function maskPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length < 4) return `+91 ${digits}`;
  const first = digits.slice(0, 2);
  const last = digits.slice(-3);
  return `+91 ${first}xxx xx${last}`;
}

/** Compact "time since" label, e.g. "just now", "2h ago", "3d ago". */
export function timeAgo(input?: string | number | Date): string {
  if (!input) return '';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 45) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(input).toLocaleDateString();
}

/** Title-case a trade category / status token, e.g. "in_progress" → "In Progress". */
export function humanize(value?: string): string {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
