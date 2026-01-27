import { injectable, inject } from "tsyringe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database/database.types.js";
import type {
  Appointment,
  AppointmentInsert,
  AppointmentUpdate,
} from "../models/Appointment.js";

@injectable()
export class AppointmentRepository {
  constructor(
    @inject("SupabaseClient")
    private supabase: SupabaseClient<Database>
  ) {}

  async create(appointmentData: AppointmentInsert): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating appointment: ${error.message}`);
    }

    return data;
  }

  async findById(appointmentId: string): Promise<Appointment | null> {
    const { data, error } = await this.supabase
      .from("appointments")
      .select("*")
      .eq("appointment_id", appointmentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error finding appointment: ${error.message}`);
    }

    return data;
  }

  async update(
    appointmentId: string,
    updateData: AppointmentUpdate
  ): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from("appointments")
      .update(updateData)
      .eq("appointment_id", appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating appointment: ${error.message}`);
    }

    return data;
  }

  async findByClinic(
    clinicId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      patientId?: string;
    }
  ): Promise<Appointment[]> {
    let query = this.supabase
      .from("appointments")
      .select(`
        *,
        patients (
          patient_id,
          name,
          contact
        )
      `)
      .eq("clinic_id", clinicId);

    if (filters?.startDate) {
      query = query.gte("start_datetime", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("start_datetime", filters.endDate);
    }

    if (filters?.patientId) {
      query = query.eq("patient_id", filters.patientId);
    }

    const { data, error } = await query.order("start_datetime", {
      ascending: true,
    });

    if (error) {
      console.error("Error finding appointments:", error);
      throw new Error(`Error finding appointments: ${error.message}`);
    }

    return data || [];
  }

  async findQueue(
    clinicId: string,
    hoursAhead: number,
    status: string
  ): Promise<Appointment[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from("appointments")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("status", status)
      .gte("start_datetime", now.toISOString())
      .lte("start_datetime", futureTime.toISOString())
      .order("start_datetime", { ascending: true });

    if (error) {
      throw new Error(`Error finding appointment queue: ${error.message}`);
    }

    return data || [];
  }

  async checkAvailability(
    clinicId: string,
    startDatetime: string,
    endDatetime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    let query = this.supabase
      .from("appointments")
      .select("appointment_id")
      .eq("clinic_id", clinicId)
      .in("status", ["pending", "confirm"])
      .or(
        `and(start_datetime.lt.${endDatetime},end_datetime.gt.${startDatetime})`
      );

    if (excludeAppointmentId) {
      query = query.neq("appointment_id", excludeAppointmentId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error checking availability: ${error.message}`);
    }

    // If any overlapping appointments found, slot is not available
    return !data || data.length === 0;
  }
}
