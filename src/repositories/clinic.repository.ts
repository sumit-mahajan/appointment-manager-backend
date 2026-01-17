import { injectable, inject } from "tsyringe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database/database.types.js";
import type { Clinic, ClinicInsert } from "../models/Clinic.js";
import type { User } from "../models/User.js";

@injectable()
export class ClinicRepository {
  constructor(
    @inject("SupabaseClient")
    private supabase: SupabaseClient<Database>
  ) {}

  async create(clinicData: ClinicInsert): Promise<Clinic> {
    const { data, error } = await this.supabase
      .from("clinics")
      .insert(clinicData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating clinic: ${error.message}`);
    }

    return data;
  }

  async findById(clinicId: string): Promise<Clinic | null> {
    const { data, error } = await this.supabase
      .from("clinics")
      .select("*")
      .eq("clinic_id", clinicId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error finding clinic: ${error.message}`);
    }

    return data;
  }

  async searchByName(name: string): Promise<Clinic[]> {
    const { data, error } = await this.supabase
      .from("clinics")
      .select("*")
      .ilike("name", `%${name}%`);

    if (error) {
      throw new Error(`Error searching clinics: ${error.message}`);
    }

    return data || [];
  }

  async listStaff(clinicId: string): Promise<User[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error listing clinic staff: ${error.message}`);
    }

    return data || [];
  }
}
