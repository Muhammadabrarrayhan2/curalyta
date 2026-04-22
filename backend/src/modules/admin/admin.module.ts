import { Router } from 'express';
import { z } from 'zod';
import { UserRole, VerificationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError, ValidationError } from '../../lib/errors';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const listUsersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  active: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

const verifyDoctorSchema = z.object({
  approve: z.boolean(),
  reason: z.string().trim().max(500).optional(),
});

const setActiveSchema = z.object({
  active: z.boolean(),
});

export const adminRouter = Router();

// ============================================================
// DASHBOARD — system-wide stats
// ============================================================

adminRouter.get(
  '/stats',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      pendingVerifications,
      activeUsers,
      totalObservations,
      totalAppointments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.doctor.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      prisma.user.count({ where: { active: true } }),
      prisma.observation.count(),
      prisma.appointment.count(),
    ]);

    const recentSignups = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    res.json({
      stats: {
        totalUsers,
        totalDoctors,
        totalPatients,
        pendingVerifications,
        activeUsers,
        totalObservations,
        totalAppointments,
      },
      recentSignups,
    });
  })
);

// ============================================================
// DOCTOR VERIFICATIONS
// ============================================================

adminRouter.get(
  '/verifications',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = (req.query.status as string | undefined) ?? 'PENDING';
    const doctors = await prisma.doctor.findMany({
      where: {
        verificationStatus:
          status === 'ALL'
            ? undefined
            : (status as VerificationStatus),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
            active: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ doctors });
  })
);

adminRouter.post(
  '/verifications/:doctorId',
  authenticate,
  requireAdmin,
  validate(verifyDoctorSchema),
  asyncHandler(async (req, res) => {
    const { approve, reason } = req.body as z.infer<typeof verifyDoctorSchema>;

    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.doctorId },
      include: { user: true },
    });
    if (!doctor) throw new NotFoundError('Dokter tidak ditemukan');

    if (!approve && !reason) {
      throw new ValidationError('Alasan penolakan wajib diisi');
    }

    const updated = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        verificationStatus: approve
          ? VerificationStatus.APPROVED
          : VerificationStatus.REJECTED,
        verifiedAt: new Date(),
        verifiedById: req.auth!.userId,
        rejectionReason: approve ? null : reason || null,
      },
    });

    // Notify doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        type: 'VERIFICATION',
        title: approve ? 'Akun Anda telah diverifikasi' : 'Verifikasi akun ditolak',
        message: approve
          ? 'Selamat! Akun dokter Anda telah disetujui. Anda sekarang dapat menggunakan fitur penuh Curalyta.'
          : `Verifikasi akun Anda ditolak. Alasan: ${reason}`,
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: approve ? 'doctor_approved' : 'doctor_rejected',
        entity: 'doctor',
        entityId: doctor.id,
        metadata: { reason: reason ?? null },
      },
    });

    res.json({ doctor: updated });
  })
);

// ============================================================
// USER MANAGEMENT
// ============================================================

adminRouter.get(
  '/users',
  authenticate,
  requireAdmin,
  validate(listUsersSchema, 'query'),
  asyncHandler(async (req, res) => {
    const parsed = req.query as unknown as z.infer<typeof listUsersSchema>;
    const { role, active, search } = parsed;
    const page = Number(parsed.page);
    const pageSize = Number(parsed.pageSize);

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (active !== undefined) where.active = active;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          active: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          doctor: { select: { verificationStatus: true, specialization: true } },
        },
      }),
    ]);

    res.json({
      users,
      pagination: { total, page, pageSize },
    });
  })
);

adminRouter.post(
  '/users/:id/active',
  authenticate,
  requireAdmin,
  validate(setActiveSchema),
  asyncHandler(async (req, res) => {
    const { active } = req.body as z.infer<typeof setActiveSchema>;

    if (req.params.id === req.auth!.userId && !active) {
      throw new ValidationError('Admin tidak dapat menonaktifkan akun sendiri');
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new NotFoundError('User tidak ditemukan');

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { active },
      select: { id: true, email: true, name: true, active: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.auth!.userId,
        action: active ? 'user_activated' : 'user_deactivated',
        entity: 'user',
        entityId: user.id,
      },
    });

    res.json({ user: updated });
  })
);

// ============================================================
// AUDIT LOG VIEWER
// ============================================================

adminRouter.get(
  '/audit',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, name: true, role: true } },
      },
    });
    res.json({ logs });
  })
);

// ============================================================
// SYSTEM INFO
// ============================================================

adminRouter.get(
  '/system',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const { config } = await import('../../config');
    res.json({
      system: {
        env: config.env,
        aiEnabled: config.ai.enabled,
        aiModel: config.ai.enabled ? config.ai.model : null,
        uploadLimitMB: config.upload.maxMB,
      },
    });
  })
);
