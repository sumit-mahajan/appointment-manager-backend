import type { ClinicRow } from "../database/database.types.js";

export type Clinic = ClinicRow;
export type ClinicInsert = Pick<ClinicRow, "name" | "owner_id"> &
  Partial<Pick<ClinicRow, "contact" | "address">>;
export type ClinicUpdate = Partial<
  Omit<ClinicRow, "clinic_id" | "created_at" | "updated_at">
>;
