import { injectable, inject } from "tsyringe";
import type { Pool, PoolClient } from "pg";
import type {
  Appointment,
  AppointmentInsert,
  AppointmentUpdate,
} from "../models/Appointment.js";
import { ConflictError } from "../types/errors.js";
import { rethrowPgError } from "../utils/pg-error.util.js";

@injectable()
export class AppointmentRepository {
  constructor(@inject("DbPool") private pool: Pool) {}

  async create(appointmentData: AppointmentInsert): Promise<Appointment> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      if (appointmentData.clinic_id) {
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1::text))", [
          appointmentData.clinic_id,
        ]);
      }

      if (
        appointmentData.clinic_id &&
        !appointmentData.is_emergency &&
        appointmentData.end_datetime
      ) {
        const available = await this.isSlotAvailable(
          client,
          appointmentData.clinic_id,
          appointmentData.start_datetime,
          appointmentData.end_datetime
        );
        if (!available) {
          await client.query("ROLLBACK");
          throw new ConflictError("Time slot is not available");
        }
      }

      const { rows } = await client.query<Appointment>(
        `INSERT INTO appointments (
          patient_id, clinic_id, created_by, start_datetime, end_datetime,
          duration_in_minutes, is_emergency, is_follow_up_pending, status, did_show_up, reason, booked_via
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          appointmentData.patient_id ?? null,
          appointmentData.clinic_id ?? null,
          appointmentData.created_by ?? null,
          appointmentData.start_datetime,
          appointmentData.end_datetime ?? null,
          appointmentData.duration_in_minutes,
          appointmentData.is_emergency ?? false,
          appointmentData.is_follow_up_pending ?? false,
          appointmentData.status ?? "pending",
          appointmentData.did_show_up ?? false,
          appointmentData.reason ?? null,
          appointmentData.booked_via ?? "staff",
        ]
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      if (error instanceof ConflictError) throw error;
      rethrowPgError(error, "Error creating appointment");
    } finally {
      client.release();
    }
  }

  async findById(appointmentId: string): Promise<Appointment | null> {
    const { rows } = await this.pool.query<Appointment>(
      "SELECT * FROM appointments WHERE appointment_id = $1",
      [appointmentId]
    );
    return rows[0] ?? null;
  }

  async update(
    appointmentId: string,
    updateData: AppointmentUpdate
  ): Promise<Appointment> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query<Appointment>(
        "SELECT * FROM appointments WHERE appointment_id = $1 FOR UPDATE",
        [appointmentId]
      );
      const appointment = existing.rows[0];
      if (!appointment) {
        await client.query("ROLLBACK");
        throw new Error("Appointment not found");
      }

      if (appointment.clinic_id) {
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1::text))", [
          appointment.clinic_id,
        ]);
      }

      const startTime = updateData.start_datetime ?? appointment.start_datetime;
      const endTime = updateData.end_datetime ?? appointment.end_datetime;
      const isEmergency =
        updateData.is_emergency ?? appointment.is_emergency ?? false;

      if (
        appointment.clinic_id &&
        endTime &&
        !isEmergency &&
        (updateData.start_datetime || updateData.end_datetime)
      ) {
        const available = await this.isSlotAvailable(
          client,
          appointment.clinic_id,
          startTime,
          endTime,
          appointmentId
        );
        if (!available) {
          await client.query("ROLLBACK");
          throw new ConflictError("Time slot is not available");
        }
      }

      const { rows } = await client.query<Appointment>(
        `UPDATE appointments SET
          status = COALESCE($1, status),
          start_datetime = COALESCE($2, start_datetime),
          end_datetime = COALESCE($3, end_datetime),
          duration_in_minutes = COALESCE($4, duration_in_minutes),
          did_show_up = COALESCE($5, did_show_up),
          is_emergency = COALESCE($6, is_emergency),
          is_follow_up_pending = COALESCE($7, is_follow_up_pending),
          modified_by = COALESCE($8, modified_by)
        WHERE appointment_id = $9
        RETURNING *`,
        [
          updateData.status ?? null,
          updateData.start_datetime ?? null,
          updateData.end_datetime ?? null,
          updateData.duration_in_minutes ?? null,
          updateData.did_show_up ?? null,
          updateData.is_emergency ?? null,
          updateData.is_follow_up_pending ?? null,
          updateData.modified_by ?? null,
          appointmentId,
        ]
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      if (error instanceof ConflictError) throw error;
      rethrowPgError(error, "Error updating appointment");
    } finally {
      client.release();
    }
  }

  async findByClinic(
    clinicId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      patientId?: string;
    }
  ): Promise<Appointment[]> {
    const conditions = ["a.clinic_id = $1"];
    const params: unknown[] = [clinicId];
    let paramIndex = 2;

    if (filters?.startDate) {
      conditions.push(`a.start_datetime >= $${paramIndex++}`);
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      conditions.push(`a.start_datetime <= $${paramIndex++}`);
      params.push(filters.endDate);
    }
    if (filters?.patientId) {
      conditions.push(`a.patient_id = $${paramIndex++}`);
      params.push(filters.patientId);
    }

    const { rows } = await this.pool.query(
      `SELECT
         a.*,
         CASE WHEN p.patient_id IS NULL THEN NULL
         ELSE json_build_object(
           'patient_id', p.patient_id,
           'name', p.name,
           'contact', p.contact
         ) END AS patients
       FROM appointments a
       LEFT JOIN patients p ON a.patient_id = p.patient_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY a.start_datetime ASC`,
      params
    );

    return rows as Appointment[];
  }

  async findQueue(
    clinicId: string,
    hoursAhead: number,
    status: string
  ): Promise<Appointment[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const { rows } = await this.pool.query<Appointment>(
      `SELECT * FROM appointments
       WHERE clinic_id = $1
         AND status = $2
         AND start_datetime >= $3
         AND start_datetime <= $4
       ORDER BY start_datetime ASC`,
      [clinicId, status, now.toISOString(), futureTime.toISOString()]
    );
    return rows;
  }

  async checkAvailability(
    clinicId: string,
    startDatetime: string,
    endDatetime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      return await this.isSlotAvailable(
        client,
        clinicId,
        startDatetime,
        endDatetime,
        excludeAppointmentId
      );
    } finally {
      client.release();
    }
  }

  private async isSlotAvailable(
    client: PoolClient,
    clinicId: string,
    startDatetime: string,
    endDatetime: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const { rows } = await client.query<{ appointment_id: string }>(
      `SELECT appointment_id FROM appointments
       WHERE clinic_id = $1
         AND status IN ('pending', 'confirm')
         AND (is_emergency IS FALSE OR is_emergency IS NULL)
         AND start_datetime < $3
         AND end_datetime > $2
         AND ($4::uuid IS NULL OR appointment_id != $4::uuid)
       LIMIT 1`,
      [
        clinicId,
        startDatetime,
        endDatetime,
        excludeAppointmentId ?? null,
      ]
    );
    return rows.length === 0;
  }

  /** Count upcoming active appointments for a patient at a clinic */
  async countFutureByPatient(
    clinicId: string,
    patientId: string
  ): Promise<number> {
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM appointments
       WHERE clinic_id = $1
         AND patient_id = $2
         AND start_datetime > NOW()
         AND status IN ('pending', 'confirm')`,
      [clinicId, patientId]
    );
    return parseInt(rows[0]?.count ?? "0", 10);
  }
}
