import { z } from "zod";

export const publicBookSchema = z.object({
  body: z.object({
    clinicId: z.string().uuid(),
    name: z.string().min(1).max(100),
    phone: z.string().min(5).max(20),
    preferredDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    preferredTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
    notes: z.string().max(500).optional(),
  }),
});
