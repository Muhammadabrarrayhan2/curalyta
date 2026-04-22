import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { config } from '../../config';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError, ForbiddenError, ValidationError } from '../../lib/errors';
import { authenticate, requirePatient } from '../../middleware/auth';
import { requireVerifiedDoctor } from '../../middleware/doctorGuard';

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.upload.dir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `${ts}-${rand}-${safe}`);
  },
});

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipe file tidak diizinkan: ${file.mimetype}`));
  },
});

const metadataSchema = z.object({
  patientId: z.string().cuid().optional(),
  category: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const documentsRouter = Router();

async function verifyPatientAccess(doctorId: string, patientId: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError('Pasien tidak ditemukan');
  if (patient.doctorId !== doctorId) throw new ForbiddenError();
}

// Doctor: upload document for a patient
documentsRouter.post(
  '/',
  authenticate,
  requireVerifiedDoctor,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ValidationError('File tidak ditemukan');

    const parsed = metadataSchema.safeParse(req.body);
    if (!parsed.success) {
      fs.unlink(req.file.path, () => {}); // cleanup
      throw new ValidationError('Metadata tidak valid', parsed.error.errors);
    }

    if (parsed.data.patientId) {
      await verifyPatientAccess(req.doctor!.id, parsed.data.patientId);
    }

    const doc = await prisma.document.create({
      data: {
        doctorId: req.doctor!.id,
        patientId: parsed.data.patientId || null,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        path: req.file.filename, // store only filename; resolve via upload dir
        category: parsed.data.category || null,
        notes: parsed.data.notes || null,
      },
    });

    res.status(201).json({ document: doc });
  })
);

// List documents (doctor)
documentsRouter.get(
  '/',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const patientId = req.query.patientId as string | undefined;
    if (patientId) {
      await verifyPatientAccess(req.doctor!.id, patientId);
    }
    const docs = await prisma.document.findMany({
      where: {
        doctorId: req.doctor!.id,
        ...(patientId ? { patientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ documents: docs });
  })
);

// Download/view file
documentsRouter.get(
  '/:id/download',
  authenticate,
  asyncHandler(async (req, res) => {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });
    if (!doc) throw new NotFoundError('Dokumen tidak ditemukan');

    // Authorization: doctor (owner) or patient (subject)
    let authorized = false;
    if (req.auth!.role === 'DOCTOR') {
      const d = await prisma.doctor.findUnique({
        where: { userId: req.auth!.userId },
      });
      authorized = d?.id === doc.doctorId;
    } else if (req.auth!.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({
        where: { userId: req.auth!.userId },
      });
      authorized = p?.id === doc.patientId;
    } else if (req.auth!.role === 'ADMIN') {
      authorized = true;
    }

    if (!authorized) throw new ForbiddenError();

    const fullPath = path.join(config.upload.dir, doc.path);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundError('File tidak ditemukan di server');
    }

    res.download(fullPath, doc.name);
  })
);

// Delete document
documentsRouter.delete(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) throw new NotFoundError();
    if (doc.doctorId !== req.doctor!.id) throw new ForbiddenError();

    await prisma.document.delete({ where: { id: req.params.id } });

    const fullPath = path.join(config.upload.dir, doc.path);
    fs.unlink(fullPath, () => {}); // silent unlink
    res.json({ success: true });
  })
);

// Patient: list own documents
export const myDocumentsRouter = Router();
myDocumentsRouter.get(
  '/',
  authenticate,
  requirePatient,
  asyncHandler(async (req, res) => {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.auth!.userId },
    });
    if (!patient) throw new NotFoundError('Profil pasien tidak ditemukan');
    const docs = await prisma.document.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ documents: docs });
  })
);
