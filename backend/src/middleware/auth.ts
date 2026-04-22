import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';

export interface AuthPayload {
  userId: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, config.auth.jwtSecret) as AuthPayload;
  } catch {
    throw new UnauthorizedError('Token tidak valid atau kedaluwarsa');
  }
}

/**
 * Extract JWT from Authorization header or HTTP-only cookie.
 */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  if (req.cookies?.curalyta_token) {
    return req.cookies.curalyta_token;
  }
  return null;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) throw new UnauthorizedError('Autentikasi diperlukan');

    const payload = verifyToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, email: true, active: true },
    });

    if (!user) throw new UnauthorizedError('Akun tidak ditemukan');
    if (!user.active) throw new UnauthorizedError('Akun dinonaktifkan');

    req.auth = { userId: user.id, role: user.role, email: user.email };
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restrict access to specific role(s).
 */
export function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) return next(new UnauthorizedError());
    if (!allowed.includes(req.auth.role)) {
      return next(new ForbiddenError(`Akses dibatasi untuk ${allowed.join(', ')}`));
    }
    next();
  };
}

export const requireDoctor = requireRole(UserRole.DOCTOR);
export const requirePatient = requireRole(UserRole.PATIENT);
export const requireAdmin = requireRole(UserRole.ADMIN);
