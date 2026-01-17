import { injectable, inject } from "tsyringe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database/database.types.js";
import type { User, UserInsert, UserUpdate } from "../models/User.js";

@injectable()
export class UserRepository {
  constructor(
    @inject("SupabaseClient")
    private supabase: SupabaseClient<Database>
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error finding user by email: ${error.message}`);
    }

    return data;
  }

  async findById(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error finding user by ID: ${error.message}`);
    }

    return data;
  }

  async create(userData: UserInsert): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .insert(userData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }

    return data;
  }

  async updateClinicId(userId: string, clinicId: string): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .update({ clinic_id: clinicId })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user clinic: ${error.message}`);
    }

    return data;
  }

  async update(userId: string, userData: UserUpdate): Promise<User> {
    const { data, error } = await this.supabase
      .from("users")
      .update(userData)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }

    return data;
  }
}
