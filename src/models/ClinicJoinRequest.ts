import type { Database } from "../database/database.types.js";

// Use generated Supabase types as base
export type ClinicJoinRequest =
  Database["public"]["Tables"]["clinic_join_requests"]["Row"];
export type ClinicJoinRequestInsert =
  Database["public"]["Tables"]["clinic_join_requests"]["Insert"];
export type ClinicJoinRequestUpdate =
  Database["public"]["Tables"]["clinic_join_requests"]["Update"];

// Type-safe status enum
export type ClinicJoinRequestStatus = "pending" | "approved" | "rejected";
