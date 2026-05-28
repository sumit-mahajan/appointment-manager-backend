import type { PatientRow } from "../database/database.types.js";

export type Patient = PatientRow;
export type PatientInsert = Pick<PatientRow, "name"> &
  Partial<Pick<PatientRow, "contact" | "clinic_id" | "created_by" | "modified_by">>;
export type PatientUpdate = Partial<
  Omit<PatientRow, "patient_id" | "created_at">
>;
