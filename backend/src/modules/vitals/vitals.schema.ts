import { z } from 'zod';
import { Consciousness } from '@prisma/client';

export const createVitalsSchema = z.object({
  patientId: z.string().cuid(),
  date: z.string().datetime().optional(),
  heartRate: z.number().int().min(20).max(300).optional().nullable(),
  systolicBP: z.number().int().min(40).max(300).optional().nullable(),
  diastolicBP: z.number().int().min(20).max(200).optional().nullable(),
  temperature: z.number().min(25).max(45).optional().nullable(),
  oxygenSaturation: z.number().int().min(50).max(100).optional().nullable(),
  respirationRate: z.number().int().min(4).max(80).optional().nullable(),
  bloodGlucose: z.number().min(20).max(900).optional().nullable(),
  weight: z.number().min(0.5).max(400).optional().nullable(),
  height: z.number().min(20).max(260).optional().nullable(),
  consciousness: z.nativeEnum(Consciousness).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});
export type CreateVitalsInput = z.infer<typeof createVitalsSchema>;

export const vitalsTrendSchema = z.object({
  metric: z.enum([
    'heartRate',
    'systolicBP',
    'diastolicBP',
    'temperature',
    'oxygenSaturation',
    'respirationRate',
  ]),
});
