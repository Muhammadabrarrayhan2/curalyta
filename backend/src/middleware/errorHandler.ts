import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { isDev } from '../config';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

function isPrismaKnownError(err: unknown): err is { code: string; meta?: Record<string, unknown>; message: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string' &&
    /^P\d{4}$/.test((err as { code: string }).code)
  );
}

function isPrismaInitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; message?: string };
  if (e.name === 'PrismaClientInitializationError') return true;
  const msg = (e.message || '').toLowerCase();
  return (
    msg.includes("can't reach database") ||
    msg.includes('econnrefused') ||
    msg.includes('connection refused') ||
    msg.includes('database server') ||
    msg.includes('connect etimedout')
  );
}

function isPrismaValidationError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  return (err as { name?: string }).name === 'PrismaClientValidationError';
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Terjadi kesalahan pada server';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Data tidak valid';
    details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  } else if (isPrismaInitError(err) || err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'Tidak dapat terhubung ke database. Pastikan PostgreSQL berjalan dan DATABASE_URL benar.';
    logger.error('Database initialization error', { message: err.message });
  } else if (isPrismaKnownError(err) || err instanceof Prisma.PrismaClientKnownRequestError) {
    const pErr = err as unknown as { code: string; meta?: Record<string, unknown>; message: string };
    if (pErr.code === 'P2002') {
      statusCode = 409;
      code = 'DUPLICATE';
      const target = (pErr.meta?.target as string[] | undefined)?.join(', ');
      message = target ? `${target} sudah digunakan` : 'Data sudah ada dalam sistem';
    } else if (pErr.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Data tidak ditemukan';
    } else if (pErr.code === 'P2003') {
      statusCode = 400;
      code = 'CONSTRAINT_ERROR';
      message = 'Data terkait tidak valid';
    } else if (pErr.code === 'P2021' || pErr.code === 'P2022') {
      statusCode = 503;
      code = 'DATABASE_NOT_MIGRATED';
      message = 'Database belum ter-setup. Migrasi belum dijalankan. Cek log backend.';
      logger.error('Database not migrated', { code: pErr.code, meta: pErr.meta });
    } else {
      statusCode = 500;
      code = 'DATABASE_ERROR';
      message = isDev
        ? `Database error ${pErr.code}: ${pErr.message.split('\n')[0]}`
        : 'Operasi database gagal. Cek log backend untuk detail.';
      logger.error('Unhandled Prisma error', { code: pErr.code, message: pErr.message });
    }
  } else if (isPrismaValidationError(err) || err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = isDev ? err.message.split('\n')[0] : 'Data yang dikirim tidak valid';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${statusCode} ${code}`, {
      message: err.message,
      stack: err.stack,
    });
  } else if (statusCode >= 400 && isDev) {
    logger.debug(`${req.method} ${req.originalUrl} → ${statusCode} ${code}: ${message}`);
  }

  const response: ErrorResponse = { error: { code, message } };
  if (details !== undefined) response.error.details = details;
  if (isDev && statusCode >= 500) response.error.stack = err.stack;

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
    },
  });
}
