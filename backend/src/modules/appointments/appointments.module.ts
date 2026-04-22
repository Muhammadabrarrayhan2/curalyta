import { Router } from 'express';
import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError, ForbiddenError } from '../../lib/errors';
import { authenticate, requirePatient } from '../../middleware/auth';
import { requireVerifiedDoctor } from '../../middleware/doctorGuard';
import { validate } from '../../middleware/validate';

const createAppointmentSchema = z.object({
  patientId: z.string().cuid(),
  date: z.string().datetime(),
  duration: z.number().int().min(5).max(240).default(30),
  reason: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const updateAppointmentSchema = z.object({
  date: z.string().datetime().optional(),
  duration: z.number().int().min(5).max(240).optional(),
  reason: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.nativeEnum(AppointmentStatus).optional(),
});

const listAppointmentsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  scope: z.enum(['today', 'upcoming', 'past', 'all']).optional(),
});

async function verifyPatientOwnership(doctorId: string, patientId: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError('Pasien tidak ditemukan');
  if (patient.doctorId !== doctorId)
    throw new ForbiddenError('Pasien tidak terhubung dengan Anda');
  return patient;
}

const appointmentsService = {
  async listForDoctor(doctorId: string, filters: z.infer<typeof listAppointmentsSchema>) {
    const where: Record<string, unknown> = { doctorId };
    const now = new Date();

    if (filters.status) where.status = filters.status;

    if (filters.scope === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    } else if (filters.scope === 'upcoming') {
      where.date = { gte: now };
    } else if (filters.scope === 'past') {
      where.date = { lt: now };
    } else if (filters.from || filters.to) {
      const range: Record<string, Date> = {};
      if (filters.from) range.gte = new Date(filters.from);
      if (filters.to) range.lte = new Date(filters.to);
      where.date = range;
    }

    return prisma.appointment.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        patient: { select: { id: true, name: true, dateOfBirth: true, gender: true } },
      },
    });
  },

  async create(doctorId: string, input: z.infer<typeof createAppointmentSchema>) {
    await verifyPatientOwnership(doctorId, input.patientId);
    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId: input.patientId,
        date: new Date(input.date),
        duration: input.duration,
        reason: input.reason || null,
        notes: input.notes || null,
      },
      include: { patient: { select: { id: true, name: true, userId: true } } },
    });

    // Notify patient if they have a user account
    if (appointment.patient.userId) {
      await prisma.notification.create({
        data: {
          userId: appointment.patient.userId,
          type: 'APPOINTMENT',
          title: 'Appointment baru dijadwalkan',
          message: `${new Date(appointment.date).toLocaleString('id-ID')}${
            input.reason ? ` — ${input.reason}` : ''
          }`,
        },
      });
    }

    return appointment;
  },

  async update(doctorId: string, id: string, input: z.infer<typeof updateAppointmentSchema>) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Appointment tidak ditemukan');
    if (existing.doctorId !== doctorId) throw new ForbiddenError();

    const data: Record<string, unknown> = {};
    if (input.date !== undefined) data.date = new Date(input.date);
    if (input.duration !== undefined) data.duration = input.duration;
    if (input.reason !== undefined) data.reason = input.reason;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.status !== undefined) data.status = input.status;

    return prisma.appointment.update({
      where: { id },
      data,
      include: { patient: { select: { id: true, name: true } } },
    });
  },

  async remove(doctorId: string, id: string) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Appointment tidak ditemukan');
    if (existing.doctorId !== doctorId) throw new ForbiddenError();
    await prisma.appointment.delete({ where: { id } });
  },

  async listForPatient(userId: string) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundError('Profil pasien tidak ditemukan');
    return prisma.appointment.findMany({
      where: { patientId: patient.id },
      orderBy: { date: 'asc' },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
    });
  },
};

export const appointmentsRouter = Router();

appointmentsRouter.get(
  '/',
  authenticate,
  requireVerifiedDoctor,
  validate(listAppointmentsSchema, 'query'),
  asyncHandler(async (req, res) => {
    const items = await appointmentsService.listForDoctor(
      req.doctor!.id,
      req.query as never
    );
    res.json({ appointments: items });
  })
);

appointmentsRouter.post(
  '/',
  authenticate,
  requireVerifiedDoctor,
  validate(createAppointmentSchema),
  asyncHandler(async (req, res) => {
    const appt = await appointmentsService.create(req.doctor!.id, req.body);
    res.status(201).json({ appointment: appt });
  })
);

appointmentsRouter.patch(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  validate(updateAppointmentSchema),
  asyncHandler(async (req, res) => {
    const appt = await appointmentsService.update(
      req.doctor!.id,
      req.params.id,
      req.body
    );
    res.json({ appointment: appt });
  })
);

appointmentsRouter.delete(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    await appointmentsService.remove(req.doctor!.id, req.params.id);
    res.json({ success: true });
  })
);

export const myAppointmentsRouter = Router();
myAppointmentsRouter.get(
  '/',
  authenticate,
  requirePatient,
  asyncHandler(async (req, res) => {
    const items = await appointmentsService.listForPatient(req.auth!.userId);
    res.json({ appointments: items });
  })
);
