import { Router } from 'express';
import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError, ForbiddenError } from '../../lib/errors';
import { authenticate } from '../../middleware/auth';
import { requireVerifiedDoctor } from '../../middleware/doctorGuard';
import { validate } from '../../middleware/validate';

// ============================================================
// Schemas
// ============================================================

const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  patientId: z.string().cuid().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueAt: z.string().datetime().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueAt: z.string().datetime().optional().nullable(),
});

const listTasksSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  patientId: z.string().cuid().optional(),
  scope: z.enum(['today', 'week', 'overdue', 'all']).optional(),
});

// ============================================================
// Service
// ============================================================

const tasksService = {
  async list(
    doctorId: string,
    filters: z.infer<typeof listTasksSchema>
  ) {
    const where: Record<string, unknown> = { doctorId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.patientId) where.patientId = filters.patientId;

    const now = new Date();
    if (filters.scope === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      where.dueAt = { gte: start, lte: end };
    } else if (filters.scope === 'week') {
      const end = new Date(); end.setDate(end.getDate() + 7);
      where.dueAt = { gte: now, lte: end };
    } else if (filters.scope === 'overdue') {
      where.dueAt = { lt: now };
      where.status = { not: TaskStatus.DONE };
    }

    return prisma.task.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
    });
  },

  async create(doctorId: string, input: z.infer<typeof createTaskSchema>) {
    // Verify patient ownership if provided
    if (input.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: input.patientId },
      });
      if (!patient || patient.doctorId !== doctorId) {
        throw new ForbiddenError('Pasien tidak terhubung dengan Anda');
      }
    }

    return prisma.task.create({
      data: {
        doctorId,
        title: input.title,
        description: input.description || null,
        patientId: input.patientId || null,
        priority: input.priority,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
      },
    });
  },

  async update(doctorId: string, id: string, input: z.infer<typeof updateTaskSchema>) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Tugas tidak ditemukan');
    if (existing.doctorId !== doctorId)
      throw new ForbiddenError('Anda tidak memiliki akses ke tugas ini');

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === TaskStatus.DONE) data.completedAt = new Date();
      else if (existing.status === TaskStatus.DONE) data.completedAt = null;
    }
    if (input.dueAt !== undefined) data.dueAt = input.dueAt ? new Date(input.dueAt) : null;

    return prisma.task.update({ where: { id }, data });
  },

  async remove(doctorId: string, id: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Tugas tidak ditemukan');
    if (existing.doctorId !== doctorId)
      throw new ForbiddenError('Anda tidak memiliki akses ke tugas ini');
    await prisma.task.delete({ where: { id } });
  },

  async stats(doctorId: string) {
    const [total, pending, done, overdue] = await Promise.all([
      prisma.task.count({ where: { doctorId } }),
      prisma.task.count({
        where: { doctorId, status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } },
      }),
      prisma.task.count({ where: { doctorId, status: TaskStatus.DONE } }),
      prisma.task.count({
        where: {
          doctorId,
          status: { not: TaskStatus.DONE },
          dueAt: { lt: new Date() },
        },
      }),
    ]);
    return { total, pending, done, overdue };
  },
};

// ============================================================
// Router
// ============================================================

export const tasksRouter = Router();

tasksRouter.get(
  '/',
  authenticate,
  requireVerifiedDoctor,
  validate(listTasksSchema, 'query'),
  asyncHandler(async (req, res) => {
    const tasks = await tasksService.list(req.doctor!.id, req.query as never);
    res.json({ tasks });
  })
);

tasksRouter.get(
  '/stats',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const stats = await tasksService.stats(req.doctor!.id);
    res.json(stats);
  })
);

tasksRouter.post(
  '/',
  authenticate,
  requireVerifiedDoctor,
  validate(createTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await tasksService.create(req.doctor!.id, req.body);
    res.status(201).json({ task });
  })
);

tasksRouter.patch(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  validate(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await tasksService.update(req.doctor!.id, req.params.id, req.body);
    res.json({ task });
  })
);

tasksRouter.delete(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    await tasksService.remove(req.doctor!.id, req.params.id);
    res.json({ success: true });
  })
);
