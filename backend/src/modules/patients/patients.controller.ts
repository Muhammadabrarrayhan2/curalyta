import { Router } from 'express';
import { patientsService } from './patients.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireVerifiedDoctor } from '../../middleware/doctorGuard';
import { validate } from '../../middleware/validate';
import { requirePatient } from '../../middleware/auth';
import {
  createPatientSchema,
  updatePatientSchema,
  listPatientsSchema,
  linkPatientSchema,
} from './patients.schema';

export const patientsRouter = Router();

// ============================================================
// DOCTOR ENDPOINTS — require verified doctor
// ============================================================

patientsRouter.get(
  '/',
  authenticate,
  requireVerifiedDoctor,
  validate(listPatientsSchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await patientsService.listForDoctor(req.doctor!.id, req.query as never);
    res.json(result);
  })
);

patientsRouter.post(
  '/',
  authenticate,
  requireVerifiedDoctor,
  validate(createPatientSchema),
  asyncHandler(async (req, res) => {
    const patient = await patientsService.createForDoctor(req.doctor!.id, req.body);
    res.status(201).json({ patient });
  })
);

patientsRouter.get(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const patient = await patientsService.getForDoctor(req.doctor!.id, req.params.id);
    res.json({ patient });
  })
);

patientsRouter.patch(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  validate(updatePatientSchema),
  asyncHandler(async (req, res) => {
    const patient = await patientsService.update(req.doctor!.id, req.params.id, req.body);
    res.json({ patient });
  })
);

patientsRouter.delete(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    await patientsService.remove(req.doctor!.id, req.params.id);
    res.json({ success: true });
  })
);

patientsRouter.post(
  '/link',
  authenticate,
  requireVerifiedDoctor,
  validate(linkPatientSchema),
  asyncHandler(async (req, res) => {
    const patient = await patientsService.linkToDoctor(req.doctor!.id, req.body.patientId);
    res.json({ patient });
  })
);

// ============================================================
// PATIENT ENDPOINTS — self-service
// ============================================================

export const myPatientRouter = Router();

myPatientRouter.get(
  '/profile',
  authenticate,
  requirePatient,
  asyncHandler(async (req, res) => {
    const profile = await patientsService.getOwnProfile(req.auth!.userId);
    res.json({ patient: profile });
  })
);

myPatientRouter.patch(
  '/profile',
  authenticate,
  requirePatient,
  validate(updatePatientSchema),
  asyncHandler(async (req, res) => {
    const profile = await patientsService.updateOwnProfile(req.auth!.userId, req.body);
    res.json({ patient: profile });
  })
);
