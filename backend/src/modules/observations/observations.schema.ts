import { z } from 'zod';

export const createObservationSchema = z.object({
  patientId: z.string().cuid(),
  date: z.string().datetime().optional(),
  subjective: z.string().trim().max(5000).optional().nullable(),
  objective: z.string().trim().max(5000).optional().nullable(),
  assessment: z.string().trim().max(5000).optional().nullable(),
  plan: z.string().trim().max(5000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
});
export type CreateObservationInput = z.infer<typeof createObservationSchema>;

export const updateObservationSchema = createObservationSchema.partial().omit({ patientId: true });
export type UpdateObservationInput = z.infer<typeof updateObservationSchema>;
