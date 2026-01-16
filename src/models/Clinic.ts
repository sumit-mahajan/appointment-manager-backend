import type { Database } from "../database/database.types.js";

// Use generated Supabase types as base
export type Clinic = Database["public"]["Tables"]["clinics"]["Row"];
export type ClinicInsert = Database["public"]["Tables"]["clinics"]["Insert"];
export type ClinicUpdate = Database["public"]["Tables"]["clinics"]["Update"];
