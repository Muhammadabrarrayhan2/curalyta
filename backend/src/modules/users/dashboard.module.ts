import { Router } from 'express';
import { TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/auth';
import { requireVerifiedDoctor } from '../../middleware/doctorGuard';
import { ml } from '../ml/ml.service';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/doctor',
  authenticate,
  requireVerifiedDoctor,
  asyncHandler(async (req, res) => {
    const doctorId = req.doctor!.id;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const now = new Date();

    const [
      patients,
      appointmentsToday,
      pendingTasks,
      overdueTasks,
      recentObservations,
    ] = await Promise.all([
      prisma.patient.findMany({ where: { doctorId } }),
      prisma.appointment.findMany({
        where: { doctorId, date: { gte: todayStart, lte: todayEnd } },
        orderBy: { date: 'asc' },
        include: {
          patient: { select: { id: true, name: true, dateOfBirth: true, gender: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          doctorId,
          status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        },
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
        take: 10,
      }),
      prisma.task.count({
        where: {
          doctorId,
          status: { not: TaskStatus.DONE },
          dueAt: { lt: now },
        },
      }),
      prisma.observation.findMany({
        where: { doctorId },
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          patient: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Compute priority scoring for all patients
    const enrichedPatients = await Promise.all(
      patients.map(async (p: { id: string; name: string; dateOfBirth: Date; gender: string; chronicConditions: string | null }) => {
        const latestVitals = await prisma.vitalSign.findFirst({
          where: { patientId: p.id },
          orderBy: { date: 'desc' },
        });
        const prio = ml.computePriority(p, latestVitals);
        return {
          id: p.id,
          name: p.name,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          chronicConditions: p.chronicConditions,
          latestVitals,
          news2: prio.news,
          priority: prio.priority,
        };
      })
    );

    const critical = enrichedPatients
      .filter((p) => p.news2.level === 'critical' || p.news2.level === 'high')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    const recentPatients = [...enrichedPatients]
      .sort((a, b) => {
        const aT = a.latestVitals ? new Date(a.latestVitals.date).getTime() : 0;
        const bT = b.latestVitals ? new Date(b.latestVitals.date).getTime() : 0;
        return bT - aT;
      })
      .slice(0, 5);

    res.json({
      stats: {
        totalPatients: patients.length,
        appointmentsToday: appointmentsToday.length,
        pendingTasks: pendingTasks.length,
        overdueTasks,
        highPriorityPatients: critical.length,
      },
      appointmentsToday,
      tasks: pendingTasks,
      criticalPatients: critical,
      recentPatients,
      recentObservations,
    });
  })
);

// Patient dashboard
dashboardRouter.get(
  '/patient',
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.auth!.role !== 'PATIENT') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Akses ditolak' } });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.auth!.userId },
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!patient) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Profil pasien tidak ditemukan' } });

    const [
      latestVitals,
      upcomingAppointments,
      observationCount,
      recentObservations,
    ] = await Promise.all([
      prisma.vitalSign.findFirst({
        where: { patientId: patient.id },
        orderBy: { date: 'desc' },
      }),
      prisma.appointment.findMany({
        where: {
          patientId: patient.id,
          date: { gte: new Date() },
          status: 'SCHEDULED',
        },
        orderBy: { date: 'asc' },
        take: 3,
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.observation.count({ where: { patientId: patient.id } }),
      prisma.observation.findMany({
        where: { patientId: patient.id },
        orderBy: { date: 'desc' },
        take: 3,
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
      }),
    ]);

    res.json({
      patient,
      stats: {
        observationCount,
        upcomingAppointments: upcomingAppointments.length,
      },
      latestVitals,
      upcomingAppointments,
      recentObservations,
    });
  })
);
