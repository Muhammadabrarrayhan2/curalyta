import dotenv from 'dotenv';
import fs from 'fs';
import { resolveEnvFilePaths } from './env-path';
import { parseGroqApiKeys } from '../lib/groq';

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

  // Groq powers both Doctor AI and public Tanya AI. GROQ_API_KEYS accepts
  // several comma-separated keys that are rotated per request.
  ai: {
    apiKeys: parseGroqApiKeys(optional('GROQ_API_KEYS') || optional('GROQ_API_KEY')),
    model: optional('GROQ_MODEL', 'openai/gpt-oss-120b'),
    visionModel: optional('GROQ_VISION_MODEL', 'qwen/qwen3.8-27b'),
    get enabled() {
      return this.apiKeys.length > 0;
    },
  },

  publicAi: {
    imageMaxMB: asNumber('PUBLIC_AI_IMAGE_MAX_MB', 5),
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
