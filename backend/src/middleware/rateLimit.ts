import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak permintaan, coba lagi nanti.',
    },
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    },
  },
});
