import { injectable, inject } from "tsyringe";
import type { Pool } from "pg";
import type { Patient, PatientInsert } from "../models/Patient.js";

@injectable()
export class PatientRepository {
  constructor(@inject("DbPool") private pool: Pool) {}

  async create(patientData: PatientInsert): Promise<Patient> {
    const { rows } = await this.pool.query<Patient>(
      `INSERT INTO patients (name, contact, clinic_id, created_by, modified_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        patientData.name,
        patientData.contact ?? null,
        patientData.clinic_id ?? null,
        patientData.created_by ?? null,
        patientData.modified_by ?? null,
      ]
    );
    return rows[0];
  }

  async findById(patientId: string): Promise<Patient | null> {
    const { rows } = await this.pool.query<Patient>(
      "SELECT * FROM patients WHERE patient_id = $1",
      [patientId]
    );
    return rows[0] ?? null;
  }

  async findByClinicAndContact(
    clinicId: string,
    contact: string
  ): Promise<Patient | null> {
    const { rows } = await this.pool.query<Patient>(
      `SELECT * FROM patients
       WHERE clinic_id = $1 AND contact = $2
       LIMIT 1`,
      [clinicId, contact]
    );
    return rows[0] ?? null;
  }

  async findByClinic(clinicId: string): Promise<Patient[]> {
    const { rows } = await this.pool.query<Patient>(
      "SELECT * FROM patients WHERE clinic_id = $1 ORDER BY created_at DESC",
      [clinicId]
    );
    return rows;
  }

  async searchByClinic(clinicId: string, query: string): Promise<Patient[]> {
    const { rows } = await this.pool.query<Patient>(
      `SELECT * FROM patients
       WHERE clinic_id = $1
         AND (name ILIKE $2 OR contact ILIKE $2)
       ORDER BY created_at DESC`,
      [clinicId, `%${query}%`]
    );
    return rows;
  }

  async updateName(patientId: string, name: string): Promise<Patient> {
    const { rows } = await this.pool.query<Patient>(
      `UPDATE patients SET name = $1 WHERE patient_id = $2 RETURNING *`,
      [name, patientId]
    );
    return rows[0];
  }
}
