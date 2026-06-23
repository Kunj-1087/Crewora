/**
 * Environment Configuration — Validated with Zod
 *
 * Validates ALL required env vars on startup. Throws a hard error with a
 * clear message if any required var is missing. Never logs env var values —
 * only confirms presence.
 *
 * Exports a typed, validated config object. Never access process.env.X directly
 * anywhere else in the app.
 */

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file relative to this file's location
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Reset dotenv warning about process.env pollution
const envSchema = z.object({
  // ─── App ───────────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().positive().max(65535)),

  // ─── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // ─── Redis ─────────────────────────────────────────────────────────────────
  REDIS_URL: z
    .string()
    .default('redis://localhost:6379')
    .describe('Redis connection string for caching, rate limiting, and queues'),

  // ─── JWT — Customer ────────────────────────────────────────────────────────
  JWT_CUSTOMER_ACCESS_SECRET: z.string().min(32, 'JWT_CUSTOMER_ACCESS_SECRET must be at least 32 chars'),
  JWT_CUSTOMER_REFRESH_SECRET: z.string().min(32, 'JWT_CUSTOMER_REFRESH_SECRET must be at least 32 chars'),

  // ─── JWT — Worker ──────────────────────────────────────────────────────────
  JWT_WORKER_ACCESS_SECRET: z.string().min(32, 'JWT_WORKER_ACCESS_SECRET must be at least 32 chars'),
  JWT_WORKER_REFRESH_SECRET: z.string().min(32, 'JWT_WORKER_REFRESH_SECRET must be at least 32 chars'),

  // ─── JWT — Admin ───────────────────────────────────────────────────────────
  JWT_ADMIN_ACCESS_SECRET: z.string().min(32, 'JWT_ADMIN_ACCESS_SECRET must be at least 32 chars'),
  JWT_ADMIN_REFRESH_SECRET: z.string().min(32, 'JWT_ADMIN_REFRESH_SECRET must be at least 32 chars'),

  // ─── JWT Expiry ────────────────────────────────────────────────────────────
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ─── CORS ──────────────────────────────────────────────────────────────────
  CLIENT_URL: z
    .string()
    .url('CLIENT_URL must be a valid URL')
    .default('http://localhost:3000'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000'),

  // ─── Email (SMTP) ──────────────────────────────────────────────────────────
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z
    .string()
    .default('587')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().positive()),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),

  // ─── Encryption ────────────────────────────────────────────────────────────
  ENCRYPTION_KEY: z
    .string()
    .length(64, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    .describe('Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'),

  // ─── Sentry ────────────────────────────────────────────────────────────────
  SENTRY_DSN: z
    .string()
    .url()
    .optional()
    .describe('Sentry DSN for error tracking (optional — errors logged locally if absent)'),

  // ─── Firebase ──────────────────────────────────────────────────────────────
  FIREBASE_SERVICE_ACCOUNT: z
    .string()
    .optional()
    .describe('JSON string of Firebase service account key (optional — push falls back to mock)'),

  // ─── SMS Provider ──────────────────────────────────────────────────────────
  SMS_PROVIDER: z.enum(['mock', 'twilio', 'msg91']).default('mock'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

type EnvType = z.infer<typeof envSchema>;

function validateEnv(): EnvType {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const missingVars: string[] = [];

    for (const [key, issue] of Object.entries(formatted)) {
      if (key === '_errors') continue;
      const arr = issue as { _errors: string[] };
      if (arr._errors?.length > 0) {
        missingVars.push(`  ${key}: ${arr._errors.join(', ')}`);
      }
    }

    console.error('❌ Invalid or missing environment variables:');
    console.error('');
    console.error('The following environment variables are invalid or missing:');
    console.error('');
    missingVars.forEach((v) => console.error(v));
    console.error('');
    console.error('Copy .env.example to .env and fill in all values.');
    console.error('');

    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
export type Env = EnvType;

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
