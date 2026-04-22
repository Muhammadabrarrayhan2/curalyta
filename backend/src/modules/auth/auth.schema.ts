import { z } from 'zod';
import { UserRole, Gender } from '@prisma/client';

const passwordRule = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(128, 'Password maksimal 128 karakter');

const emailRule = z
  .string()
  .trim()
  .toLowerCase()
  .email('Format email tidak valid')
  .max(255);

const nameRule = z.string().trim().min(3, 'Nama minimal 3 karakter').max(120);
const phoneRule = z
  .string()
  .trim()
  .regex(/^[+\d\s\-()]{8,20}$/, 'Format nomor HP tidak valid');

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, 'Password diperlukan'),
  role: z.nativeEnum(UserRole).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerPatientSchema = z.object({
  email: emailRule,
  password: passwordRule,
  name: nameRule,
  phone: phoneRule,
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir tidak valid'),
  gender: z.nativeEnum(Gender),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  bloodType: z.enum(['A', 'B', 'AB', 'O']).optional().or(z.literal('')),
  allergies: z.string().trim().max(500).optional().or(z.literal('')),
  chronicConditions: z.string().trim().max(500).optional().or(z.literal('')),
  emergencyContact: z.string().trim().max(50).optional().or(z.literal('')),
});
export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;

export const registerDoctorSchema = z.object({
  email: emailRule,
  password: passwordRule,
  name: nameRule,
  phone: phoneRule,
  specialization: z.string().trim().min(2).max(120),
  licenseNumber: z.string().trim().min(3).max(50),
  sipNumber: z.string().trim().max(50).optional().or(z.literal('')),
  experience: z.number().int().min(0).max(70),
  institution: z.string().trim().min(2).max(200),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
  schedule: z.string().trim().max(500).optional().or(z.literal('')),
});
export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: passwordRule,
  })
  .refine((d) => d.oldPassword !== d.newPassword, {
    message: 'Password baru harus berbeda dari password lama',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
