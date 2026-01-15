import type { Database } from "../database/database.types.js";

// Use generated Supabase types as base
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type AppointmentInsert =
  Database["public"]["Tables"]["appointments"]["Insert"];
export type AppointmentUpdate =
  Database["public"]["Tables"]["appointments"]["Update"];

// Type-safe status enum
export type AppointmentStatus = "pending" | "confirm" | "cancel";
