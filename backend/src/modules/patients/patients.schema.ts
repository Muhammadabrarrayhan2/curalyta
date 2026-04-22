import { z } from 'zod';
import { Gender } from '@prisma/client';

const genderEnum = z.nativeEnum(Gender);

export const createPatientSchema = z.object({
  name: z.string().trim().min(3).max(120),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir tidak valid'),
  gender: genderEnum,
  address: z.string().trim().max(500).optional().nullable(),
  bloodType: z.enum(['A', 'B', 'AB', 'O']).optional().nullable(),
  allergies: z.string().trim().max(500).optional().nullable(),
  chronicConditions: z.string().trim().max(500).optional().nullable(),
  emergencyContact: z.string().trim().max(50).optional().nullable(),
  emergencyContactName: z.string().trim().max(120).optional().nullable(),
});
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial();
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

export const linkPatientSchema = z.object({
  patientId: z.string().cuid('Patient ID tidak valid'),
});

export const listPatientsSchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
