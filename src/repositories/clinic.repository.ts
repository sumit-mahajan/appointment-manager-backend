import { injectable, inject } from "tsyringe";
import type { Pool } from "pg";
import type { Clinic, ClinicInsert } from "../models/Clinic.js";
import type { User } from "../models/User.js";

@injectable()
export class ClinicRepository {
  constructor(@inject("DbPool") private pool: Pool) {}

  async create(clinicData: ClinicInsert): Promise<Clinic> {
    const { rows } = await this.pool.query<Clinic>(
      `INSERT INTO clinics (name, contact, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        clinicData.name,
        clinicData.contact ?? null,
        clinicData.address ?? null,
        clinicData.owner_id,
      ]
    );
    return rows[0];
  }

  async findById(clinicId: string): Promise<Clinic | null> {
    const { rows } = await this.pool.query<Clinic>(
      "SELECT * FROM clinics WHERE clinic_id = $1",
      [clinicId]
    );
    return rows[0] ?? null;
  }

  async searchByName(name: string): Promise<Clinic[]> {
    const { rows } = await this.pool.query<Clinic>(
      "SELECT * FROM clinics WHERE name ILIKE $1 ORDER BY name ASC",
      [`%${name}%`]
    );
    return rows;
  }

  async listAll(): Promise<Clinic[]> {
    const { rows } = await this.pool.query<Clinic>(
      "SELECT * FROM clinics ORDER BY name ASC"
    );
    return rows;
  }

  async listStaff(clinicId: string): Promise<User[]> {
    const { rows } = await this.pool.query<User>(
      "SELECT * FROM users WHERE clinic_id = $1 ORDER BY created_at DESC",
      [clinicId]
    );
    return rows;
  }
}
