import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../lib/errors';
import { ml } from '../ml/ml.service';
import type { CreateVitalsInput } from './vitals.schema';
import { Consciousness, type VitalSign } from '@prisma/client';

async function verifyPatientAccess(doctorId: string, patientId: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError('Pasien tidak ditemukan');
  if (patient.doctorId !== doctorId)
    throw new ForbiddenError('Anda tidak memiliki akses ke pasien ini');
  return patient;
}

export const vitalsService = {
  async create(doctorId: string, input: CreateVitalsInput): Promise<VitalSign> {
    await verifyPatientAccess(doctorId, input.patientId);

    const hasAnyValue =
      input.heartRate != null ||
      input.systolicBP != null ||
      input.temperature != null ||
      input.oxygenSaturation != null ||
      input.respirationRate != null ||
      input.bloodGlucose != null;

    if (!hasAnyValue) {
      throw new ValidationError('Minimal satu parameter vital harus diisi');
    }

    // Compute NEWS2 automatically
    const newsResult = ml.computeNEWS2({
      respirationRate: input.respirationRate ?? undefined,
      oxygenSaturation: input.oxygenSaturation ?? undefined,
      systolicBP: input.systolicBP ?? undefined,
      heartRate: input.heartRate ?? undefined,
      temperature: input.temperature ?? undefined,
      consciousness: input.consciousness ?? Consciousness.ALERT,
    });

    const vital = await prisma.vitalSign.create({
      data: {
        patientId: input.patientId,
        date: input.date ? new Date(input.date) : new Date(),
        heartRate: input.heartRate ?? null,
        systolicBP: input.systolicBP ?? null,
        diastolicBP: input.diastolicBP ?? null,
        temperature: input.temperature ?? null,
        oxygenSaturation: input.oxygenSaturation ?? null,
        respirationRate: input.respirationRate ?? null,
        bloodGlucose: input.bloodGlucose ?? null,
        weight: input.weight ?? null,
        height: input.height ?? null,
        consciousness: input.consciousness ?? Consciousness.ALERT,
        news2Score: newsResult.score,
        notes: input.notes ?? null,
      },
    });

    // Auto-create a follow-up task if NEWS2 is high or critical
    if (newsResult.level === 'high' || newsResult.level === 'critical') {
      const patient = await prisma.patient.findUnique({
        where: { id: input.patientId },
      });
      await prisma.task.create({
        data: {
          doctorId,
          patientId: input.patientId,
          title: `Review pasien: ${patient?.name ?? 'Unknown'} — NEWS2 ${newsResult.score}`,
          description: `Pasien menunjukkan skor NEWS2 ${newsResult.score} (${newsResult.level}). Disarankan review klinis segera.`,
          priority: newsResult.level === 'critical' ? 'URGENT' : 'HIGH',
        },
      });
    }

    return vital;
  },

  async listByPatient(doctorId: string, patientId: string) {
    await verifyPatientAccess(doctorId, patientId);
    return prisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
  },

  async getAnalysisForPatient(doctorId: string, patientId: string) {
    await verifyPatientAccess(doctorId, patientId);
    const history = await prisma.vitalSign.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const anomalies = ml.detectAnomalies(history);
    const trends = {
      heartRate: ml.computeTrend(history, 'heartRate'),
      systolicBP: ml.computeTrend(history, 'systolicBP'),
      temperature: ml.computeTrend(history, 'temperature'),
      oxygenSaturation: ml.computeTrend(history, 'oxygenSaturation'),
      respirationRate: ml.computeTrend(history, 'respirationRate'),
    };

    return { anomalies, trends, historyCount: history.length };
  },

  async remove(doctorId: string, id: string) {
    const vital = await prisma.vitalSign.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!vital) throw new NotFoundError('Data vital tidak ditemukan');
    if (vital.patient.doctorId !== doctorId)
      throw new ForbiddenError('Anda tidak memiliki akses');
    await prisma.vitalSign.delete({ where: { id } });
  },

  async listForPatientSelf(userId: string) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundError('Profil pasien tidak ditemukan');
    return prisma.vitalSign.findMany({
      where: { patientId: patient.id },
      orderBy: { date: 'desc' },
    });
  },
};
