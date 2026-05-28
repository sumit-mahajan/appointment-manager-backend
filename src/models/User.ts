import type { UserRow } from "../database/database.types.js";

export type User = UserRow;
export type UserInsert = Pick<UserRow, "name" | "email" | "password_hash"> &
  Partial<Pick<UserRow, "contact" | "clinic_id">>;
export type UserUpdate = Partial<
  Omit<UserRow, "user_id" | "created_at" | "updated_at">
>;
