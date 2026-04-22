import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config, isDev } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimit';
import { apiRouter } from './routes';

const app = express();

// Trust proxy (for rate limiting behind reverse proxy in production)
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isDev ? false : undefined,
  })
);

// CORS
app.use(
  cors({
    origin: config.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Logging
if (isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limit (applied to /api/*)
app.use('/api', globalLimiter);

// Root health (fast path, no rate limit)
app.get('/', (_req, res) => {
  res.json({
    service: 'Curalyta API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

// API routes
app.use('/api', apiRouter);

// 404 handler (must come after routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// ============================================================
// STARTUP
// ============================================================

async function ensureDefaultAdmin() {
  try {
    const bcrypt = await import('bcryptjs');
    const adminEmail = config.admin.email;
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      logger.info(`✓ Admin account exists: ${adminEmail}`);
      return;
    }
    const passwordHash = await bcrypt.default.hash(config.admin.password, config.auth.bcryptRounds);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        name: 'Administrator',
        emailVerified: true,
        active: true,
      },
    });
    logger.info(`✓ Default admin created: ${adminEmail} / ${config.admin.password}`);
    logger.warn('⚠  Ganti password admin segera setelah login pertama!');
  } catch (err) {
    logger.error('Failed to ensure default admin', {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

async function start() {
  try {
    // Verify DB connection
    await prisma.$connect();
    logger.info('✓ Database connected');

    // Ensure default admin exists (idempotent)
    await ensureDefaultAdmin();

    const server = app.listen(config.port, () => {
      logger.info(`✓ Curalyta API running on http://localhost:${config.port}`);
      logger.info(`  Environment: ${config.env}`);
      logger.info(`  CORS origin: ${config.corsOrigin}`);
      logger.info(`  AI enabled:  ${config.ai.enabled ? 'yes (' + config.ai.model + ')' : 'no (fallback mode)'}`);
      logger.info('');
      logger.info('  Health:  GET http://localhost:' + config.port + '/api/health');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('✓ Clean shutdown complete');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection', { reason: String(reason) });
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
      process.exit(1);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Failed to start server', { message });
    process.exit(1);
  }
}

start();
