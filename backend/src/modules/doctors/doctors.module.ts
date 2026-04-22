import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError } from '../../lib/errors';
import { authenticate } from '../../middleware/auth';
import { requireDoctor } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const updateDoctorProfileSchema = z.object({
  specialization: z.string().trim().min(2).max(120).optional(),
  sipNumber: z.string().trim().max(50).optional().nullable(),
  experience: z.number().int().min(0).max(70).optional(),
  institution: z.string().trim().min(2).max(200).optional(),
  bio: z.string().trim().max(1000).optional().nullable(),
  schedule: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(20).optional(),
});

export const doctorsRouter = Router();

// Get own doctor profile (includes verification status)
doctorsRouter.get(
  '/me',
  authenticate,
  requireDoctor,
  asyncHandler(async (req, res) => {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.auth!.userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
      },
    });
    if (!doctor) throw new NotFoundError('Profil dokter tidak ditemukan');

    const [patientCount, appointmentCount, taskCount] = await Promise.all([
      prisma.patient.count({ where: { doctorId: doctor.id } }),
      prisma.appointment.count({ where: { doctorId: doctor.id } }),
      prisma.task.count({ where: { doctorId: doctor.id } }),
    ]);

    res.json({
      doctor: {
        ...doctor,
        stats: { patientCount, appointmentCount, taskCount },
      },
    });
  })
);

// Update own doctor profile (limited fields — license cannot be self-modified)
doctorsRouter.patch(
  '/me',
  authenticate,
  requireDoctor,
  validate(updateDoctorProfileSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateDoctorProfileSchema>;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.auth!.userId },
    });
    if (!doctor) throw new NotFoundError();

    const doctorData: Record<string, unknown> = {};
    if (body.specialization !== undefined) doctorData.specialization = body.specialization;
    if (body.sipNumber !== undefined) doctorData.sipNumber = body.sipNumber;
    if (body.experience !== undefined) doctorData.experience = body.experience;
    if (body.institution !== undefined) doctorData.institution = body.institution;
    if (body.bio !== undefined) doctorData.bio = body.bio;
    if (body.schedule !== undefined) doctorData.schedule = body.schedule;

    const [updatedDoctor] = await prisma.$transaction([
      prisma.doctor.update({ where: { id: doctor.id }, data: doctorData }),
      ...(body.phone !== undefined
        ? [
            prisma.user.update({
              where: { id: req.auth!.userId },
              data: { phone: body.phone },
            }),
          ]
        : []),
    ]);

    res.json({ doctor: updatedDoctor });
  })
);

// Patient-facing: browse verified doctors (no auth required for discovery? — keep auth for privacy)
doctorsRouter.get(
  '/',
  authenticate,
  asyncHandler(async (_req, res) => {
    const doctors = await prisma.doctor.findMany({
      where: { verificationStatus: 'APPROVED' },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ doctors });
  })
);

doctorsRouter.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    if (!doctor || doctor.verificationStatus !== 'APPROVED') {
      throw new NotFoundError('Dokter tidak ditemukan');
    }
    res.json({ doctor });
  })
);
