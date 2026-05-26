import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000').transform(Number),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT — Customer
  JWT_CUSTOMER_ACCESS_SECRET: z.string().min(32, 'JWT_CUSTOMER_ACCESS_SECRET must be at least 32 chars'),
  JWT_CUSTOMER_REFRESH_SECRET: z.string().min(32, 'JWT_CUSTOMER_REFRESH_SECRET must be at least 32 chars'),

  // JWT — Worker
  JWT_WORKER_ACCESS_SECRET: z.string().min(32, 'JWT_WORKER_ACCESS_SECRET must be at least 32 chars'),
  JWT_WORKER_REFRESH_SECRET: z.string().min(32, 'JWT_WORKER_REFRESH_SECRET must be at least 32 chars'),

  // JWT — Admin
  JWT_ADMIN_ACCESS_SECRET: z.string().min(32, 'JWT_ADMIN_ACCESS_SECRET must be at least 32 chars'),

  // JWT Expiry
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // Email
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
