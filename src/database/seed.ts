import "dotenv/config";
import bcrypt from "bcrypt";
import { pool } from "./db.js";

async function seed() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Owner user (no clinic yet)
  const userResult = await pool.query(
    `INSERT INTO users (name, email, password_hash, contact)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING user_id`,
    ["Dr. Demo Owner", "demo@appoint.dev", passwordHash, "+91-9876543210"]
  );
  const ownerId = userResult.rows[0].user_id;

  // Clinic
  let clinicId: string;
  const existingClinic = await pool.query(
    "SELECT clinic_id FROM clinics WHERE owner_id = $1 LIMIT 1",
    [ownerId]
  );

  if (existingClinic.rows[0]) {
    clinicId = existingClinic.rows[0].clinic_id;
  } else {
    const clinicResult = await pool.query(
      `INSERT INTO clinics (name, contact, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING clinic_id`,
      [
        "Sunrise Medical Clinic",
        "+91-9876543210",
        "42 MG Road, Bangalore",
        ownerId,
      ]
    );
    clinicId = clinicResult.rows[0].clinic_id;
  }

  await pool.query("UPDATE users SET clinic_id = $1 WHERE user_id = $2", [
    clinicId,
    ownerId,
  ]);

  const patients = [
    { name: "John Doe", contact: "+91-9000000001" },
    { name: "Jane Smith", contact: "+91-9000000002" },
    { name: "Raj Patel", contact: "+91-9000000003" },
    { name: "Priya Sharma", contact: "+91-9000000004" },
    { name: "Alex Kumar", contact: "+91-9000000005" },
  ];

  const patientIds: string[] = [];
  for (const p of patients) {
    const { rows } = await pool.query(
      `INSERT INTO patients (name, contact, clinic_id, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING patient_id`,
      [p.name, p.contact, clinicId, ownerId]
    );
    if (rows[0]) {
      patientIds.push(rows[0].patient_id);
    }
  }

  if (patientIds.length === 0) {
    const existing = await pool.query(
      "SELECT patient_id FROM patients WHERE clinic_id = $1 LIMIT 5",
      [clinicId]
    );
    patientIds.push(...existing.rows.map((r) => r.patient_id));
  }

  const now = new Date();
  const slots = [
    { dayOffset: 0, hour: 10, status: "confirm" },
    { dayOffset: 0, hour: 14, status: "pending" },
    { dayOffset: 1, hour: 9, status: "confirm" },
    { dayOffset: 1, hour: 11, status: "pending" },
    { dayOffset: 2, hour: 15, status: "confirm" },
    { dayOffset: 3, hour: 10, status: "pending" },
    { dayOffset: 5, hour: 16, status: "confirm" },
    { dayOffset: -1, hour: 11, status: "cancel" },
  ];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const start = new Date(now);
    start.setDate(start.getDate() + slot.dayOffset);
    start.setHours(slot.hour, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const patientId = patientIds[i % patientIds.length];

    await pool.query(
      `INSERT INTO appointments (
        patient_id, clinic_id, created_by, start_datetime, end_datetime,
        duration_in_minutes, status, did_show_up
      )
      SELECT $1, $2, $3, $4, $5, 30, $6, false
      WHERE NOT EXISTS (
        SELECT 1 FROM appointments
        WHERE clinic_id = $2
          AND start_datetime = $4
          AND patient_id = $1
      )`,
      [
        patientId,
        clinicId,
        ownerId,
        start.toISOString(),
        end.toISOString(),
        slot.status,
      ]
    );
  }

  console.log("Seed complete.");
  console.log("  Login: demo@appoint.dev / demo1234");
  console.log("  Clinic: Sunrise Medical Clinic");
  console.log(`  Clinic ID (for /book?clinic=): ${clinicId}`);
  console.log(`  Public book URL: /book?clinic=${clinicId}`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
