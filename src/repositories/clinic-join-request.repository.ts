import { injectable, inject } from "tsyringe";
import type { Pool } from "pg";
import type {
  ClinicJoinRequest,
  ClinicJoinRequestInsert,
  ClinicJoinRequestStatus,
} from "../models/ClinicJoinRequest.js";

@injectable()
export class ClinicJoinRequestRepository {
  constructor(@inject("DbPool") private pool: Pool) {}

  async create(
    requestData: ClinicJoinRequestInsert
  ): Promise<ClinicJoinRequest> {
    const { rows } = await this.pool.query<ClinicJoinRequest>(
      `INSERT INTO clinic_join_requests (user_id, clinic_id, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        requestData.user_id,
        requestData.clinic_id,
        requestData.status ?? "pending",
      ]
    );
    return rows[0];
  }

  async findById(requestId: string): Promise<ClinicJoinRequest | null> {
    const { rows } = await this.pool.query<ClinicJoinRequest>(
      "SELECT * FROM clinic_join_requests WHERE request_id = $1",
      [requestId]
    );
    return rows[0] ?? null;
  }

  async findPendingByClinic(clinicId: string): Promise<ClinicJoinRequest[]> {
    const { rows } = await this.pool.query<ClinicJoinRequest>(
      `SELECT * FROM clinic_join_requests
       WHERE clinic_id = $1 AND status = 'pending'
       ORDER BY requested_at DESC`,
      [clinicId]
    );
    return rows;
  }

  async findByClinicAndStatus(
    clinicId: string,
    status: ClinicJoinRequestStatus
  ): Promise<ClinicJoinRequest[]> {
    const { rows } = await this.pool.query<ClinicJoinRequest>(
      `SELECT * FROM clinic_join_requests
       WHERE clinic_id = $1 AND status = $2
       ORDER BY requested_at DESC`,
      [clinicId, status]
    );
    return rows;
  }

  async updateStatus(
    requestId: string,
    status: ClinicJoinRequestStatus
  ): Promise<ClinicJoinRequest> {
    const { rows } = await this.pool.query<ClinicJoinRequest>(
      `UPDATE clinic_join_requests
       SET status = $1, responded_at = NOW()
       WHERE request_id = $2
       RETURNING *`,
      [status, requestId]
    );
    return rows[0];
  }

  async checkExistingPendingRequest(
    userId: string,
    clinicId: string
  ): Promise<ClinicJoinRequest | null> {
    const { rows } = await this.pool.query<ClinicJoinRequest>(
      `SELECT * FROM clinic_join_requests
       WHERE user_id = $1 AND clinic_id = $2 AND status = 'pending'
       LIMIT 1`,
      [userId, clinicId]
    );
    return rows[0] ?? null;
  }
}
