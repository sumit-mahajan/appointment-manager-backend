import { z } from "zod";

export const createAppointmentSchema = z.object({
  body: z.object({
    patientId: z.string().uuid({ message: "Invalid patient ID" }),
    start: z.string().datetime({ message: "Invalid start datetime" }),
    end: z.string().datetime({ message: "Invalid end datetime" }),
    durationInMinutes: z.number().positive().optional(),
    isEmergency: z.boolean().optional(),
    isFollowUpPending: z.boolean().optional(),
  }),
});

export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid appointment ID" }),
  }),
  body: z.object({
    status: z.enum(["pending", "confirm", "cancel"]).optional(),
    start: z
      .string()
      .datetime({ message: "Invalid start datetime" })
      .optional(),
    end: z.string().datetime({ message: "Invalid end datetime" }).optional(),
    durationInMinutes: z.number().positive().optional(),
    didShowUp: z.boolean().optional(),
    isEmergency: z.boolean().optional(),
  }),
});

export const listAppointmentsSchema = z.object({
  query: z.object({
    start: z
      .string()
      .datetime({ message: "Invalid start datetime" })
      .optional(),
    end: z.string().datetime({ message: "Invalid end datetime" }).optional(),
    patientId: z.string().uuid({ message: "Invalid patient ID" }).optional(),
  }),
});

export const queueSchema = z.object({
  query: z.object({
    hours: z.coerce.number().positive().default(48),
    status: z.string().default("pending"),
  }),
});

export const availabilitySchema = z.object({
  query: z.object({
    start: z.string().datetime({ message: "Invalid start datetime" }),
    end: z.string().datetime({ message: "Invalid end datetime" }),
    excludeAppointmentId: z.string().uuid().optional(),
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
export type QueueInput = z.infer<typeof queueSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
