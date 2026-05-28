import type {
  AppointmentRow,
  ClinicJoinRequestRow,
  ClinicRow,
  PatientRow,
  UserRow,
} from "../database/database.types.js";

export type Appointment = AppointmentRow;
export type AppointmentInsert = Partial<AppointmentRow> &
  Pick<
    AppointmentRow,
    "start_datetime" | "duration_in_minutes"
  >;
export type AppointmentUpdate = Partial<
  Omit<AppointmentRow, "appointment_id" | "created_at">
>;

export type AppointmentStatus = "pending" | "confirm" | "cancel";
export type BookedVia = "staff" | "patient";
