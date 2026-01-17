import { injectable, inject } from "tsyringe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database/database.types.js";
import type {
  ClinicJoinRequest,
  ClinicJoinRequestInsert,
  ClinicJoinRequestStatus,
} from "../models/ClinicJoinRequest.js";

@injectable()
export class ClinicJoinRequestRepository {
  constructor(
    @inject("SupabaseClient")
    private supabase: SupabaseClient<Database>
  ) {}

  async create(
    requestData: ClinicJoinRequestInsert
  ): Promise<ClinicJoinRequest> {
    const { data, error } = await this.supabase
      .from("clinic_join_requests")
      .insert(requestData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating join request: ${error.message}`);
    }

    return data;
  }

  async findById(requestId: string): Promise<ClinicJoinRequest | null> {
    const { data, error } = await this.supabase
      .from("clinic_join_requests")
      .select("*")
      .eq("request_id", requestId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error finding join request: ${error.message}`);
    }

    return data;
  }

  async findPendingByClinic(clinicId: string): Promise<ClinicJoinRequest[]> {
    const { data, error } = await this.supabase
      .from("clinic_join_requests")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false });

    if (error) {
      throw new Error(`Error finding pending requests: ${error.message}`);
    }

    return data || [];
  }

  async findByClinicAndStatus(
    clinicId: string,
    status: ClinicJoinRequestStatus
  ): Promise<ClinicJoinRequest[]> {
    const { data, error } = await this.supabase
      .from("clinic_join_requests")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("status", status)
      .order("requested_at", { ascending: false });

    if (error) {
      throw new Error(`Error finding join requests: ${error.message}`);
    }

    return data || [];
  }

  async updateStatus(
    requestId: string,
    status: ClinicJoinRequestStatus
  ): Promise<ClinicJoinRequest> {
    const { data, error } = await this.supabase
      .from("clinic_join_requests")
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq("request_id", requestId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating join request: ${error.message}`);
    }

    return data;
  }

  async checkExistingPendingRequest(
    userId: string,
    clinicId: string
  ): Promise<ClinicJoinRequest | null> {
    const { data, error } = await this.supabase
      .from("clinic_join_requests")
      .select("*")
      .eq("user_id", userId)
      .eq("clinic_id", clinicId)
      .eq("status", "pending")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error checking existing request: ${error.message}`);
    }

    return data;
  }
}
