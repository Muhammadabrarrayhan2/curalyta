import { Router } from 'express';
import { vitalsService } from './vitals.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate, requirePatient } from '../../middleware/auth';
import { requireVerifiedDoctor } from '../../middleware/doctorGuard';
import { validate } from '../../middleware/validate';
import { createVitalsSchema } from './vitals.schema';

export const vitalsRouter = Router();

vitalsRouter.get(
  '/patient/:patientId',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const items = await vitalsService.listByPatient(req.doctor!.id, req.params.patientId);
    res.json({ vitals: items });
  })
);

vitalsRouter.get(
  '/patient/:patientId/analysis',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const analysis = await vitalsService.getAnalysisForPatient(
      req.doctor!.id,
      req.params.patientId
    );
    res.json(analysis);
  })
);

vitalsRouter.post(
  '/',
  authenticate,
  requireVerifiedDoctor,
  validate(createVitalsSchema),
  asyncHandler(async (req, res) => {
    const vital = await vitalsService.create(req.doctor!.id, req.body);
    res.status(201).json({ vital });
  })
);

vitalsRouter.delete(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    await vitalsService.remove(req.doctor!.id, req.params.id);
    res.json({ success: true });
  })
);

export const myVitalsRouter = Router();
myVitalsRouter.get(
  '/',
  authenticate,
  requirePatient,
  asyncHandler(async (req, res) => {
    const items = await vitalsService.listForPatientSelf(req.auth!.userId);
    res.json({ vitals: items });
  })
);
