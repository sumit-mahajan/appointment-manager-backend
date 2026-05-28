import type { ClinicJoinRequestRow } from "../database/database.types.js";

export type ClinicJoinRequest = ClinicJoinRequestRow;
export type ClinicJoinRequestInsert = Pick<
  ClinicJoinRequestRow,
  "user_id" | "clinic_id"
> &
  Partial<Pick<ClinicJoinRequestRow, "status">>;
export type ClinicJoinRequestUpdate = Partial<
  Omit<ClinicJoinRequestRow, "request_id" | "created_at">
>;

export type ClinicJoinRequestStatus = "pending" | "approved" | "rejected";
