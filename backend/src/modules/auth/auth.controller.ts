import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { Router } from 'express';
import {
  loginSchema,
  registerDoctorSchema,
  registerPatientSchema,
  changePasswordSchema,
} from './auth.schema';

export const authRouter = Router();

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.json({
      user: result.user,
      token: result.token,
    });
  })
);

authRouter.post(
  '/register/patient',
  validate(registerPatientSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.registerPatient(req.body);
    res.status(201).json(result);
  })
);

authRouter.post(
  '/register/doctor',
  validate(registerDoctorSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.registerDoctor(req.body);
    res.status(201).json({ user });
  })
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const profile = await authService.me(req.auth!.userId);
    res.json({ user: profile });
  })
);

authRouter.post(
  '/password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.auth!.userId, oldPassword, newPassword);
    res.json({ success: true });
  })
);

authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (_req: Request, res: Response) => {
    // Stateless JWT — client drops token. Server just acknowledges.
    res.json({ success: true });
  })
);
