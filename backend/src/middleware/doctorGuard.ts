import type { Request, Response, NextFunction } from 'express';
import { VerificationStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ForbiddenError, UnauthorizedError, NotFoundError } from '../lib/errors';

/**
 * For DOCTOR-only routes: confirms the doctor account has been verified
 * by an administrator. Attaches `req.doctor` for downstream handlers.
 */
declare global {
  namespace Express {
    interface Request {
      doctor?: {
        id: string;
        userId: string;
        specialization: string;
        verificationStatus: VerificationStatus;
      };
    }
  }
}

export async function requireVerifiedDoctor(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) throw new UnauthorizedError();

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.auth.userId },
      select: {
        id: true,
        userId: true,
        specialization: true,
        verificationStatus: true,
      },
    });

    if (!doctor) throw new NotFoundError('Profil dokter tidak ditemukan');

    if (doctor.verificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenError(
        'Akun dokter belum diverifikasi oleh administrator'
      );
    }

    req.doctor = doctor;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Lighter variant: attaches doctor profile if exists, does not enforce verification.
 * Use for routes where unverified doctors can still access (e.g. own profile).
 */
export async function attachDoctor(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) return next();
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.auth.userId },
      select: {
        id: true,
        userId: true,
        specialization: true,
        verificationStatus: true,
      },
    });
    if (doctor) req.doctor = doctor;
    next();
  } catch (err) {
    next(err);
  }
}
