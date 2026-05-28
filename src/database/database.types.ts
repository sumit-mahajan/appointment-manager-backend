/**
 * Hand-written database row types (formerly generated from Supabase).
 * Keep in sync with schema.sql.
 */

export interface UserRow {
  user_id: string;
  email: string;
  password_hash: string;
  name: string;
  contact: string | null;
  clinic_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ClinicRow {
  clinic_id: string;
  name: string;
  contact: string | null;
  address: string | null;
  owner_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ClinicJoinRequestRow {
  request_id: string;
  user_id: string;
  clinic_id: string;
  status: string | null;
  requested_at: string | null;
  responded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PatientRow {
  patient_id: string;
  name: string;
  contact: string | null;
  clinic_id: string | null;
  created_by: string | null;
  modified_by: string | null;
  created_at: string | null;
}

export interface AppointmentRow {
  appointment_id: string;
  patient_id: string | null;
  clinic_id: string | null;
  start_datetime: string;
  end_datetime: string | null;
  duration_in_minutes: number;
  is_emergency: boolean | null;
  is_follow_up_pending: boolean | null;
  status: string | null;
  did_show_up: boolean | null;
  created_by: string | null;
  modified_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  reason: string | null;
  booked_via: string | null;
}

/** Appointment with nested patient (matches former PostgREST join shape) */
export interface AppointmentWithPatient extends AppointmentRow {
  patients: Pick<PatientRow, "patient_id" | "name" | "contact"> | null;
}
