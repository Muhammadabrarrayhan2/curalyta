import { prisma } from '../../lib/prisma';
import { NotFoundError, ForbiddenError, ValidationError } from '../../lib/errors';
import type { CreateObservationInput, UpdateObservationInput } from './observations.schema';

async function verifyPatientOwnership(doctorId: string, patientId: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) throw new NotFoundError('Pasien tidak ditemukan');
  if (patient.doctorId !== doctorId)
    throw new ForbiddenError('Anda tidak memiliki akses ke pasien ini');
  return patient;
}

export const observationsService = {
  async create(doctorId: string, input: CreateObservationInput) {
    await verifyPatientOwnership(doctorId, input.patientId);

    if (!input.subjective && !input.objective && !input.assessment && !input.plan) {
      throw new ValidationError(
        'Minimal salah satu field SOAP (subjective/objective/assessment/plan) harus diisi'
      );
    }

    return prisma.observation.create({
      data: {
        patientId: input.patientId,
        doctorId,
        date: input.date ? new Date(input.date) : new Date(),
        subjective: input.subjective || null,
        objective: input.objective || null,
        assessment: input.assessment || null,
        plan: input.plan || null,
        notes: input.notes || null,
      },
    });
  },

  async listByPatient(doctorId: string, patientId: string) {
    await verifyPatientOwnership(doctorId, patientId);
    return prisma.observation.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
    });
  },

  async update(doctorId: string, id: string, input: UpdateObservationInput) {
    const existing = await prisma.observation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Observasi tidak ditemukan');
    if (existing.doctorId !== doctorId)
      throw new ForbiddenError('Anda tidak memiliki akses ke observasi ini');

    const data: Record<string, unknown> = {};
    if (input.date !== undefined) data.date = new Date(input.date);
    if (input.subjective !== undefined) data.subjective = input.subjective;
    if (input.objective !== undefined) data.objective = input.objective;
    if (input.assessment !== undefined) data.assessment = input.assessment;
    if (input.plan !== undefined) data.plan = input.plan;
    if (input.notes !== undefined) data.notes = input.notes;

    return prisma.observation.update({ where: { id }, data });
  },

  async remove(doctorId: string, id: string) {
    const existing = await prisma.observation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Observasi tidak ditemukan');
    if (existing.doctorId !== doctorId)
      throw new ForbiddenError('Anda tidak memiliki akses ke observasi ini');
    await prisma.observation.delete({ where: { id } });
  },

  async listForPatientSelf(userId: string) {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundError('Profil pasien tidak ditemukan');
    return prisma.observation.findMany({
      where: { patientId: patient.id },
      orderBy: { date: 'desc' },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
    });
  },
};
