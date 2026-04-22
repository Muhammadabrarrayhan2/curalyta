import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.controller';
import { patientsRouter, myPatientRouter } from '../modules/patients/patients.controller';
import { observationsRouter, myObservationsRouter } from '../modules/observations/observations.controller';
import { vitalsRouter, myVitalsRouter } from '../modules/vitals/vitals.controller';
import { tasksRouter } from '../modules/tasks/tasks.module';
import { appointmentsRouter, myAppointmentsRouter } from '../modules/appointments/appointments.module';
import { notificationsRouter } from '../modules/notifications/notifications.module';
import { doctorsRouter } from '../modules/doctors/doctors.module';
import { adminRouter } from '../modules/admin/admin.module';
import { documentsRouter, myDocumentsRouter } from '../modules/documents/documents.module';
import { aiRouter } from '../modules/ai/ai.controller';
import { dashboardRouter } from '../modules/users/dashboard.module';
import { newsRouter } from '../modules/news/news.module';
import { publicRouter } from '../modules/public/public.module';
import { authLimiter } from '../middleware/rateLimit';

export const apiRouter = Router();

// Health
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'curalyta-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Auth — with tighter rate limit
apiRouter.use('/auth', authLimiter, authRouter);

// Doctor-side resources (nested under their domains)
apiRouter.use('/patients', patientsRouter);
apiRouter.use('/observations', observationsRouter);
apiRouter.use('/vitals', vitalsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/appointments', appointmentsRouter);
apiRouter.use('/documents', documentsRouter);

// Shared resources
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/doctors', doctorsRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/dashboard', dashboardRouter);

// Admin
apiRouter.use('/admin', adminRouter);

// Public endpoints (no auth required — for landing page)
apiRouter.use('/public', publicRouter);
apiRouter.use('/news', newsRouter);

// Patient self-service
apiRouter.use('/me/patient', myPatientRouter);
apiRouter.use('/me/observations', myObservationsRouter);
apiRouter.use('/me/vitals', myVitalsRouter);
apiRouter.use('/me/appointments', myAppointmentsRouter);
apiRouter.use('/me/documents', myDocumentsRouter);
