import { z } from "zod";

export const createClinicSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Clinic name is required"),
    address: z.string().optional(),
    contact: z.string().optional(),
  }),
});

export const searchClinicSchema = z.object({
  query: z.object({
    name: z.string().min(1, "Search query is required"),
  }),
});

export const joinClinicSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid clinic ID" }),
  }),
});

export const listJoinRequestsSchema = z.object({
  query: z.object({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  }),
});

export const approveRejectRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Invalid request ID" }),
  }),
  body: z.object({
    status: z.enum(["approved", "rejected"], {
      message: "Status is required",
    }),
  }),
});

export type CreateClinicInput = z.infer<typeof createClinicSchema>;
export type SearchClinicInput = z.infer<typeof searchClinicSchema>;
export type JoinClinicInput = z.infer<typeof joinClinicSchema>;
export type ListJoinRequestsInput = z.infer<typeof listJoinRequestsSchema>;
export type ApproveRejectRequestInput = z.infer<
  typeof approveRejectRequestSchema
>;
