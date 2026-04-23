import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import {
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '../../lib/errors';
import { validate } from '../../middleware/validate';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import {
  PUBLIC_AI_SYSTEM_INSTRUCTION,
  buildPublicAiPromptWithOptions,
  clampHistoryContent,
  finalizePublicAiReply,
  modelSupportsPublicAiSystemInstruction,
} from './public-ai';
import {
  buildPublicAiPayload,
  type PublicAiPayload,
} from './public-ai-upload';
import { createPublicAiImageUploadMiddleware } from './public-ai-upload-middleware';
import {
  buildPublicAiRequestBody,
  fetchPublicAiResponse,
  resolvePublicAiModel,
  resolvePublicAiProviderError,
} from './public-ai-provider';

/**
 * Public endpoints for patient discovery.
 * No auth required — allows landing page and directory browsing.
 */

const listSchema = z.object({
  search: z.string().trim().optional(),
  specialization: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const publicAiImageUpload = createPublicAiImageUploadMiddleware(
  config.publicAi.imageMaxMB
);

async function sendPublicChatToGemini(payload: PublicAiPayload): Promise<string> {
  if (!config.publicAi.enabled) {
    throw new ServiceUnavailableError(
      'Fitur Tanya AI belum dikonfigurasi. Tambahkan GEMINI_API_KEY agar bisa dipakai publik.'
    );
  }

  try {
    const sanitizedHistory = payload.history.map((item) => ({
      role: item.role,
      content: clampHistoryContent(item.content),
    }));
    const hasImage = Boolean(payload.image);
    const model = resolvePublicAiModel({
      textModel: config.publicAi.model,
      visionModel: config.publicAi.visionModel,
      hasImage,
    });
    const supportsSystemInstruction = modelSupportsPublicAiSystemInstruction(model);
    const prompt = buildPublicAiPromptWithOptions(payload.message, {
      inlineSystemInstruction: !supportsSystemInstruction,
      hasImage,
    });
    const requestBody = buildPublicAiRequestBody({
      prompt,
      history: sanitizedHistory,
      image: payload.image
        ? {
            mimeType: payload.image.mimeType,
            buffer: payload.image.buffer,
          }
        : undefined,
      supportsSystemInstruction,
      systemInstruction: PUBLIC_AI_SYSTEM_INSTRUCTION,
    });

    const response = await fetchPublicAiResponse({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      apiKey: config.publicAi.apiKey,
      requestBody,
    });

    if (!response.ok) {
      const details = await response.text();
      logger.error('Public AI provider error', {
        status: response.status,
        details,
        hasImage,
        model,
      });

      if (response.status === 401 || response.status === 403) {
        throw new ServiceUnavailableError(
          'Konfigurasi Gemini bermasalah. Periksa GEMINI_API_KEY atau model yang dipakai.'
        );
      }

      if (response.status === 400 || response.status === 429) {
        throw new ServiceUnavailableError(
          resolvePublicAiProviderError({
            status: response.status,
            details,
            hasImage,
          })
        );
      }

      throw new ServiceUnavailableError(
        'Tanya AI sedang tidak tersedia. Silakan coba lagi sebentar lagi.'
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text?.trim())
      .filter(Boolean)
      .join('\n');

    if (!text) {
      throw new ServiceUnavailableError(
        'Tanya AI belum bisa memberikan jawaban. Coba pertanyaan lain.'
      );
    }

    return finalizePublicAiReply(text, {
      hasHistory: sanitizedHistory.length > 0,
    });
  } catch (err) {
    if (err instanceof ServiceUnavailableError) throw err;

    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Public AI unexpected error', { message });
    throw new ServiceUnavailableError(
      'Tanya AI sedang tidak tersedia. Silakan coba lagi sebentar lagi.'
    );
  }
}

export const publicRouter = Router();

// Simple landing stats (verified doctors count, specializations count, etc.)
publicRouter.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const [doctorCount, specializations] = await Promise.all([
      prisma.doctor.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.doctor.findMany({
        where: { verificationStatus: 'APPROVED' },
        select: { specialization: true },
        distinct: ['specialization'],
      }),
    ]);
    res.json({
      doctorCount,
      specializationCount: specializations.length,
      specializations: specializations.map((s: { specialization: string }) => s.specialization).sort(),
    });
  })
);

// Public list of verified doctors (for patient discovery)
publicRouter.get(
  '/doctors',
  validate(listSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as z.infer<typeof listSchema>;
    const page = Number(q.page) || 1;
    const pageSize = Number(q.pageSize) || 12;

    const where: Record<string, unknown> = { verificationStatus: 'APPROVED' };
    if (q.specialization) {
      where.specialization = { contains: q.specialization, mode: 'insensitive' };
    }

    // Search by name requires joining user
    const searchFilter = q.search
      ? {
          OR: [
            { user: { name: { contains: q.search, mode: 'insensitive' as const } } },
            { specialization: { contains: q.search, mode: 'insensitive' as const } },
            { institution: { contains: q.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [total, doctors] = await Promise.all([
      prisma.doctor.count({ where: { ...where, ...searchFilter } }),
      prisma.doctor.findMany({
        where: { ...where, ...searchFilter },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    interface DoctorWithUser {
      id: string;
      specialization: string;
      institution: string;
      experience: number;
      bio: string | null;
      schedule: string | null;
      user: { id: string; name: string };
    }

    res.json({
      doctors: (doctors as DoctorWithUser[]).map((d) => ({
        id: d.id,
        name: d.user.name,
        specialization: d.specialization,
        institution: d.institution,
        experience: d.experience,
        bio: d.bio,
        schedule: d.schedule,
      })),
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  })
);

// Single doctor detail (public profile for patients to browse)
publicRouter.get(
  '/doctors/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!doctor || doctor.verificationStatus !== 'APPROVED') {
      throw new NotFoundError('Dokter tidak ditemukan');
    }

    res.json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        specialization: doctor.specialization,
        institution: doctor.institution,
        experience: doctor.experience,
        bio: doctor.bio,
        schedule: doctor.schedule,
      },
    });
  })
);

publicRouter.post(
  '/ai-chat',
  publicAiImageUpload,
  asyncHandler(async (req: Request, res: Response) => {
    let payload: PublicAiPayload;

    try {
      payload = buildPublicAiPayload({
        body: req.body as { message?: unknown; history?: unknown },
        file: req.file
          ? {
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
              buffer: req.file.buffer,
            }
          : undefined,
      });
    } catch (err) {
      throw new ValidationError(
        err instanceof Error ? err.message : 'Permintaan Tanya AI tidak valid.'
      );
    }

    const reply = await sendPublicChatToGemini(payload);
    res.json({ reply });
  })
);
