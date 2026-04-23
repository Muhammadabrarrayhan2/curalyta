import dotenv from 'dotenv';
import fs from 'fs';
import { resolveEnvFilePaths } from './env-path';

for (const envPath of resolveEnvFilePaths()) {
  if (!fs.existsSync(envPath)) continue;

  dotenv.config({ path: envPath });
  break;
}

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined || v === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

function asNumber(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  env: optional('NODE_ENV', 'development'),
  port: asNumber('PORT', 4000),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5173'),

  db: {
    url: required('DATABASE_URL'),
  },

  auth: {
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),
    bcryptRounds: asNumber('BCRYPT_ROUNDS', 12),
  },

  admin: {
    email: optional('ADMIN_EMAIL', 'admin@curalyta.app'),
    password: optional('ADMIN_PASSWORD', 'Curalyta#2025'),
  },

  ai: {
    apiKey: optional('ANTHROPIC_API_KEY', ''),
    model: optional('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),
    get enabled() {
      return Boolean(this.apiKey && this.apiKey.length > 10);
    },
  },

  publicAi: {
    apiKey: optional('GEMINI_API_KEY', ''),
    model: optional('GEMINI_MODEL', 'gemma-3-27b-it'),
    visionModel: optional('GEMINI_VISION_MODEL', 'gemini-2.5-flash'),
    imageMaxMB: asNumber('PUBLIC_AI_IMAGE_MAX_MB', 5),
    get enabled() {
      return Boolean(this.apiKey && this.apiKey.length > 10);
    },
  },

  upload: {
    dir: optional('UPLOAD_DIR', './uploads'),
    maxMB: asNumber('MAX_FILE_SIZE_MB', 10),
  },

  rateLimit: {
    windowMs: asNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: asNumber('RATE_LIMIT_MAX', 200),
    authMax: asNumber('AUTH_RATE_LIMIT_MAX', 10),
  },
} as const;

export const isDev = config.env === 'development';
export const isProd = config.env === 'production';

export { resolveEnvFilePaths } from './env-path';
