import { injectable, inject } from "tsyringe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database/database.types.js";
import type { Patient, PatientInsert } from "../models/Patient.js";

@injectable()
export class PatientRepository {
  constructor(
    @inject("SupabaseClient")
    private supabase: SupabaseClient<Database>
  ) {}

  async create(patientData: PatientInsert): Promise<Patient> {
    const { data, error } = await this.supabase
      .from("patients")
      .insert(patientData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating patient: ${error.message}`);
    }

    return data;
  }

  async findById(patientId: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from("patients")
      .select("*")
      .eq("patient_id", patientId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error finding patient: ${error.message}`);
    }

    return data;
  }

  async findByClinic(clinicId: string): Promise<Patient[]> {
    const { data, error } = await this.supabase
      .from("patients")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error finding patients: ${error.message}`);
    }

    return data || [];
  }

  async searchByClinic(clinicId: string, query: string): Promise<Patient[]> {
    const { data, error } = await this.supabase
      .from("patients")
      .select("*")
      .eq("clinic_id", clinicId)
      .or(`name.ilike.%${query}%,contact.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error searching patients: ${error.message}`);
    }

    return data || [];
  }
}
