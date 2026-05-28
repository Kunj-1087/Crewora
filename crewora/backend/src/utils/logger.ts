/**
 * Structured logger using Winston.
 * - JSON format in production
 * - Pretty-print in development
 * - No sensitive data in logs
 */

import winston from 'winston';

const { combine, timestamp, json, colorize, simple, errors } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isDev ? simple() : json()
  ),
  transports: [
    new winston.transports.Console({
      format: isDev
        ? combine(colorize(), simple())
        : json(),
    }),
  ],
  // In production, add file transports or a log aggregation service
  silent: process.env.NODE_ENV === 'test',
});
