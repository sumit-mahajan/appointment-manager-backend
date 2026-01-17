import { z } from "zod";

export const createPatientSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Patient name is required"),
    contact: z.string().min(1, "Contact is required"),
  }),
});

export const searchPatientSchema = z.object({
  query: z.object({
    q: z.string().optional(),
  }),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type SearchPatientInput = z.infer<typeof searchPatientSchema>;
