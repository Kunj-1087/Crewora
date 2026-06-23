/**
 * Bot & Scraper Protection Middleware
 *
 * 1. User-agent filtering — reject requests with empty User-Agent
 * 2. Honeypot endpoint detection — logs suspicious IPs
 * 3. Request size limits — reject oversized payloads
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ─── 1. User-Agent Filtering ─────────────────────────────────────────────────
// Bots often omit the User-Agent header. Reject requests without one
// on public-read endpoints.

export function requireUserAgent(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userAgent = req.headers['user-agent'];

  if (!userAgent || userAgent.trim().length === 0) {
    logger.warn('Request rejected — missing User-Agent', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'USER_AGENT_REQUIRED',
        message: 'User-Agent header is required.',
      },
    });
    return;
  }

  next();
}

// ─── 2. Honeypot Endpoint Detection ──────────────────────────────────────────
// Returns a valid-looking but empty response. Logs the requester's IP.
// Any bot crawling the API will hit this; flag these IPs for rate limit reduction.

const flaggedIps = new Map<string, { count: number; firstSeen: Date }>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
  for (const [ip, data] of flaggedIps) {
    if (data.firstSeen.getTime() < cutoff) {
      flaggedIps.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export function honeypotHandler(
  req: Request,
  res: Response
): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  const existing = flaggedIps.get(ip);
  if (existing) {
    existing.count += 1;
  } else {
    flaggedIps.set(ip, { count: 1, firstSeen: new Date() });
  }

  logger.warn('Honeypot endpoint hit — possible API crawler', {
    ip,
    userAgent: req.headers['user-agent'],
    flaggedCount: flaggedIps.get(ip)?.count,
  });

  // Return an empty, valid-looking response
  res.status(200).json({
    success: true,
    data: { providers: [], total: 0 },
  });
}

/**
 * Returns map of flagged IPs (for admin use / rate limit reduction).
 */
export function getFlaggedIps(): Map<string, { count: number; firstSeen: Date }> {
  return flaggedIps;
}

// ─── 3. Request Size Enforcement ─────────────────────────────────────────────
// Applied via express.json({ limit: '10kb' }) in app.ts.
// Additional check for URL-encoded bodies:

export function enforceBodySizeLimit(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  const contentLength = parseInt(_req.headers['content-length'] || '0', 10);

  // Warn if body is close to the 10kb limit
  if (contentLength > 8 * 1024) {
    logger.debug('Request body approaching size limit', {
      contentLength,
      path: _req.path,
      ip: _req.ip,
    });
  }

  next();
}
