import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError, ForbiddenError } from '../../lib/errors';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const listSchema = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const notificationsRouter = Router();

notificationsRouter.get(
  '/',
  authenticate,
  validate(listSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { unreadOnly, limit } = req.query as unknown as z.infer<typeof listSchema>;
    const notifs = await prisma.notification.findMany({
      where: {
        userId: req.auth!.userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.auth!.userId, read: false },
    });
    res.json({ notifications: notifs, unreadCount });
  })
);

notificationsRouter.post(
  '/:id/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!n) throw new NotFoundError('Notifikasi tidak ditemukan');
    if (n.userId !== req.auth!.userId) throw new ForbiddenError();
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true, readAt: new Date() },
    });
    res.json({ notification: updated });
  })
);

notificationsRouter.post(
  '/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.auth!.userId, read: false },
      data: { read: true, readAt: new Date() },
    });
    res.json({ success: true });
  })
);

notificationsRouter.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!n) throw new NotFoundError();
    if (n.userId !== req.auth!.userId) throw new ForbiddenError();
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);
