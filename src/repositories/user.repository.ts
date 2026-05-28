import { injectable, inject } from "tsyringe";
import type { Pool } from "pg";
import type { User, UserInsert, UserUpdate } from "../models/User.js";

@injectable()
export class UserRepository {
  constructor(@inject("DbPool") private pool: Pool) {}

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query<User>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    return rows[0] ?? null;
  }

  async findById(userId: string): Promise<User | null> {
    const { rows } = await this.pool.query<User>(
      "SELECT * FROM users WHERE user_id = $1",
      [userId]
    );
    return rows[0] ?? null;
  }

  async create(userData: UserInsert): Promise<User> {
    const { rows } = await this.pool.query<User>(
      `INSERT INTO users (name, email, password_hash, contact, clinic_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userData.name,
        userData.email,
        userData.password_hash,
        userData.contact ?? null,
        userData.clinic_id ?? null,
      ]
    );
    return rows[0];
  }

  async updateClinicId(userId: string, clinicId: string): Promise<User> {
    const { rows } = await this.pool.query<User>(
      `UPDATE users SET clinic_id = $1 WHERE user_id = $2 RETURNING *`,
      [clinicId, userId]
    );
    return rows[0];
  }

  async update(userId: string, userData: UserUpdate): Promise<User> {
    const { rows } = await this.pool.query<User>(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           password_hash = COALESCE($3, password_hash),
           contact = COALESCE($4, contact),
           clinic_id = COALESCE($5, clinic_id)
       WHERE user_id = $6
       RETURNING *`,
      [
        userData.name ?? null,
        userData.email ?? null,
        userData.password_hash ?? null,
        userData.contact ?? null,
        userData.clinic_id ?? null,
        userId,
      ]
    );
    return rows[0];
  }
}
