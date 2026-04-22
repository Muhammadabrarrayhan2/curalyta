import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ConflictError } from '../../lib/errors';
import { ml } from '../ml/ml.service';
import type { CreatePatientInput, UpdatePatientInput } from './patients.schema';
import type { Patient } from '@prisma/client';

export const patientsService = {
  /**
   * Creates an offline patient record (no user account) owned by a doctor.
   */
  async createForDoctor(doctorId: string, input: CreatePatientInput): Promise<Patient> {
    const dob = new Date(input.dateOfBirth);
    return prisma.patient.create({
      data: {
        name: input.name,
        dateOfBirth: dob,
        gender: input.gender,
        address: input.address || null,
        bloodType: input.bloodType || null,
        allergies: input.allergies || null,
        chronicConditions: input.chronicConditions || null,
        emergencyContact: input.emergencyContact || null,
        emergencyContactName: input.emergencyContactName || null,
        doctorId,
      },
    });
  },

  /**
   * Lists a doctor's patients with enrichment (NEWS2, priority, latest vitals).
   */
  async listForDoctor(
    doctorId: string,
    opts: { search?: string; page: number; pageSize: number }
  ) {
    const where = {
      doctorId,
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search, mode: 'insensitive' as const } },
              { chronicConditions: { contains: opts.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
      }),
    ]);

    // Enrich with latest vitals + NEWS2
    const enriched = await Promise.all(
      patients.map(async (p: Patient) => {
        const latestVitals = await prisma.vitalSign.findFirst({
          where: { patientId: p.id },
          orderBy: { date: 'desc' },
        });
        const priority = ml.computePriority(p, latestVitals);
        return {
          ...p,
          latestVitals,
          news2: priority.news,
          priority: priority.priority,
        };
      })
    );

    // Sort by priority desc
    enriched.sort((a, b) => b.priority - a.priority);

    return {
      data: enriched,
      pagination: { total, page: opts.page, pageSize: opts.pageSize },
    };
  },

  /**
   * Gets a single patient with authorization check.
   */
  async getForDoctor(doctorId: string, patientId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { id: true, email: true, phone: true } },
      },
    });
    if (!patient) throw new NotFoundError('Pasien tidak ditemukan');
    if (patient.doctorId !== doctorId)
      throw new ForbiddenError('Anda tidak memiliki akses ke pasien ini');

    const [latestVitals, vitalsHistory, observationCount] = await Promise.all([
      prisma.vitalSign.findFirst({
        where: { patientId },
        orderBy: { date: 'desc' },
      }),
      prisma.vitalSign.findMany({
        where: { patientId },
        orderBy: { date: 'desc' },
        take: 20,
      }),
      prisma.observation.count({ where: { patientId } }),
    ]);

    const priority = ml.computePriority(patient, latestVitals);
    const anomalies = ml.detectAnomalies(vitalsHistory);

    return {
      ...patient,
      latestVitals,
      news2: priority.news,
      priority: priority.priority,
      anomalies,
      observationCount,
    };
  },

  async update(doctorId: string, patientId: string, input: UpdatePatientInput) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundError('Pasien tidak ditemukan');
    if (patient.doctorId !== doctorId)
      throw new ForbiddenError('Anda tidak memiliki akses ke pasien ini');

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.dateOfBirth !== undefined)
      data.dateOfBirth = new Date(input.dateOfBirth);
    if (input.gender !== undefined) data.gender = input.gender;
    if (input.address !== undefined) data.address = input.address || null;
    if (input.bloodType !== undefined) data.bloodType = input.bloodType || null;
    if (input.allergies !== undefined) data.allergies = input.allergies || null;
    if (input.chronicConditions !== undefined)
      data.chronicConditions = input.chronicConditions || null;
    if (input.emergencyContact !== undefined)
      data.emergencyContact = input.emergencyContact || null;
    if (input.emergencyContactName !== undefined)
      data.emergencyContactName = input.emergencyContactName || null;

    return prisma.patient.update({ where: { id: patientId }, data });
  },

  async remove(doctorId: string, patientId: string) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundError('Pasien tidak ditemukan');
    if (patient.doctorId !== doctorId)
      throw new ForbiddenError('Anda tidak memiliki akses ke pasien ini');
    await prisma.patient.delete({ where: { id: patientId } });
  },

  /**
   * Doctor links an existing registered patient (with user account) to themselves.
   */
  async linkToDoctor(doctorId: string, patientId: string) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundError('Pasien tidak ditemukan');
    if (patient.doctorId === doctorId) {
      throw new ConflictError('Pasien sudah terhubung dengan Anda');
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: { doctorId },
    });

    if (updated.userId) {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          type: 'SYSTEM',
          title: 'Dokter terhubung',
          message: 'Seorang dokter kini terhubung dengan profil kesehatan Anda.',
        },
      });
    }

    return updated;
  },

  /**
   * Patient-side: get own profile.
   */
  async getOwnProfile(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });
    if (!patient) throw new NotFoundError('Profil pasien tidak ditemukan');

    const [latestVitals, observationCount, consultationCount] = await Promise.all([
      prisma.vitalSign.findFirst({
        where: { patientId: patient.id },
        orderBy: { date: 'desc' },
      }),
      prisma.observation.count({ where: { patientId: patient.id } }),
      prisma.consultation.count({ where: { patientId: patient.id } }),
    ]);

    return {
      ...patient,
      latestVitals,
      observationCount,
      consultationCount,
    };
  },

  /**
   * Patient-side: update own profile (limited fields).
   */
  async updateOwnProfile(userId: string, input: UpdatePatientInput) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundError('Profil pasien tidak ditemukan');

    const data: Record<string, unknown> = {};
    if (input.address !== undefined) data.address = input.address || null;
    if (input.allergies !== undefined) data.allergies = input.allergies || null;
    if (input.chronicConditions !== undefined)
      data.chronicConditions = input.chronicConditions || null;
    if (input.emergencyContact !== undefined)
      data.emergencyContact = input.emergencyContact || null;
    if (input.emergencyContactName !== undefined)
      data.emergencyContactName = input.emergencyContactName || null;
    if (input.bloodType !== undefined) data.bloodType = input.bloodType || null;

    return prisma.patient.update({ where: { id: patient.id }, data });
  },
};
