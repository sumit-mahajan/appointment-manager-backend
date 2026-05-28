import type { DatabaseError } from "pg";
import { ConflictError } from "../types/errors.js";

export function isPgError(error: unknown): error is DatabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as DatabaseError).code === "string"
  );
}

/** Map Postgres constraint violations to domain errors */
export function rethrowPgError(error: unknown, context: string): never {
  if (isPgError(error)) {
    if (error.code === "23P01") {
      throw new ConflictError("Time slot is not available");
    }
    if (error.code === "23505") {
      throw new ConflictError(`${context}: duplicate record`);
    }
  }
  throw error instanceof Error
    ? error
    : new Error(`${context}: ${String(error)}`);
}
