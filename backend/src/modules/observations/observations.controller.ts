import { Router } from 'express';
import { observationsService } from './observations.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate, requirePatient } from '../../middleware/auth';
import { requireVerifiedDoctor } from '../../middleware/doctorGuard';
import { validate } from '../../middleware/validate';
import {
  createObservationSchema,
  updateObservationSchema,
} from './observations.schema';

export const observationsRouter = Router();

// Doctor: list observations for a patient
observationsRouter.get(
  '/patient/:patientId',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const items = await observationsService.listByPatient(
      req.doctor!.id,
      req.params.patientId
    );
    res.json({ observations: items });
  })
);

// Doctor: create observation
observationsRouter.post(
  '/',
  authenticate,
  requireVerifiedDoctor,
  validate(createObservationSchema),
  asyncHandler(async (req, res) => {
    const obs = await observationsService.create(req.doctor!.id, req.body);
    res.status(201).json({ observation: obs });
  })
);

// Doctor: update
observationsRouter.patch(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  validate(updateObservationSchema),
  asyncHandler(async (req, res) => {
    const obs = await observationsService.update(
      req.doctor!.id,
      req.params.id,
      req.body
    );
    res.json({ observation: obs });
  })
);

// Doctor: delete
observationsRouter.delete(
  '/:id',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    await observationsService.remove(req.doctor!.id, req.params.id);
    res.json({ success: true });
  })
);

// Patient: list own observations
export const myObservationsRouter = Router();
myObservationsRouter.get(
  '/',
  authenticate,
  requirePatient,
  asyncHandler(async (req, res) => {
    const items = await observationsService.listForPatientSelf(req.auth!.userId);
    res.json({ observations: items });
  })
);
