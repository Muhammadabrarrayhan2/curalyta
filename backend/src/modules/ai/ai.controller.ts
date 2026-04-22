import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireVerifiedDoctor } from '../../middleware/doctorGuard';
import { validate } from '../../middleware/validate';
import { NotFoundError, ForbiddenError, ServiceUnavailableError } from '../../lib/errors';
import { aiService } from './ai.service';
import { ml } from '../ml/ml.service';

const summarizeSchema = z.object({
  patientId: z.string().cuid(),
});

const chatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  patientId: z.string().cuid().optional().nullable(),
  conversationId: z.string().cuid().optional().nullable(),
});

async function verifyPatientAccess(doctorId: string, patientId: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError('Pasien tidak ditemukan');
  if (patient.doctorId !== doctorId) throw new ForbiddenError();
  return patient;
}

export const aiRouter = Router();

// Status endpoint — allows frontend to check if AI is enabled
aiRouter.get(
  '/status',
  authenticate,
  asyncHandler(async (_req, res) => {
    res.json({ enabled: aiService.isEnabled() });
  })
);

// Summarize patient clinical data
aiRouter.post(
  '/summarize',
  authenticate,
  requireVerifiedDoctor,
  validate(summarizeSchema),
  asyncHandler(async (req, res) => {
    if (!aiService.isEnabled()) {
      throw new ServiceUnavailableError(
        'AI Assistant belum dikonfigurasi. Hubungi administrator.'
      );
    }

    const { patientId } = req.body as z.infer<typeof summarizeSchema>;
    const patient = await verifyPatientAccess(req.doctor!.id, patientId);

    const [observations, vitals] = await Promise.all([
      prisma.observation.findMany({
        where: { patientId },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.vitalSign.findMany({
        where: { patientId },
        orderBy: { date: 'desc' },
        take: 10,
      }),
    ]);

    const anomalies = ml.detectAnomalies(vitals);
    const summary = await aiService.summarizePatient(
      patient,
      observations,
      vitals,
      anomalies
    );

    // Persist as consultation summary
    await prisma.consultation.create({
      data: {
        doctorId: req.doctor!.id,
        patientId,
        summary: 'AI-generated clinical summary',
        aiSummary: summary,
      },
    });

    res.json({ summary });
  })
);

// Contextual chat (optionally tied to a specific patient)
aiRouter.post(
  '/chat',
  authenticate,
  requireVerifiedDoctor,
  validate(chatSchema),
  asyncHandler(async (req, res) => {
    if (!aiService.isEnabled()) {
      throw new ServiceUnavailableError('AI Assistant belum dikonfigurasi.');
    }

    const { message, patientId, conversationId } =
      req.body as z.infer<typeof chatSchema>;

    let contextPrefix = '';
    if (patientId) {
      const patient = await verifyPatientAccess(req.doctor!.id, patientId);
      const [observations, vitals] = await Promise.all([
        prisma.observation.findMany({
          where: { patientId },
          orderBy: { date: 'desc' },
          take: 5,
        }),
        prisma.vitalSign.findMany({
          where: { patientId },
          orderBy: { date: 'desc' },
          take: 5,
        }),
      ]);
      contextPrefix = `Konteks pasien:\n${aiService.buildPatientContext(patient, observations, vitals)}\n\n---\n\nPertanyaan dokter: `;
    }

    // Load or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.aiConversation.findUnique({
        where: { id: conversationId },
      });
      if (!conversation || conversation.userId !== req.auth!.userId) {
        throw new NotFoundError('Percakapan tidak ditemukan');
      }
    } else {
      conversation = await prisma.aiConversation.create({
        data: {
          userId: req.auth!.userId,
          patientId: patientId || null,
          title: message.slice(0, 80),
        },
      });
    }

    // Load history
    const history = await prisma.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: contextPrefix + message },
    ];

    const reply = await aiService.chat(messages);

    // Persist both messages
    await prisma.$transaction([
      prisma.aiMessage.create({
        data: { conversationId: conversation.id, role: 'user', content: message },
      }),
      prisma.aiMessage.create({
        data: { conversationId: conversation.id, role: 'assistant', content: reply },
      }),
      prisma.aiConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      }),
    ]);

    res.json({
      reply,
      conversationId: conversation.id,
    });
  })
);

// List user's AI conversations
aiRouter.get(
  '/conversations',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: req.auth!.userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        _count: { select: { messages: true } },
      },
    });
    res.json({ conversations });
  })
);

aiRouter.get(
  '/conversations/:id',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const conv = await prisma.aiConversation.findUnique({
      where: { id: req.params.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conv) throw new NotFoundError('Percakapan tidak ditemukan');
    if (conv.userId !== req.auth!.userId) throw new ForbiddenError();
    res.json({ conversation: conv });
  })
);

aiRouter.delete(
  '/conversations/:id',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const conv = await prisma.aiConversation.findUnique({
      where: { id: req.params.id },
    });
    if (!conv) throw new NotFoundError();
    if (conv.userId !== req.auth!.userId) throw new ForbiddenError();
    await prisma.aiConversation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  })
);
