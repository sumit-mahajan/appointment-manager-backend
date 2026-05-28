-- Appoint — Neon PostgreSQL Schema
-- Run this once to set up the database

-- Required extension for appointment overlap EXCLUDE constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Updated_at trigger function (reused across tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────
-- users (created before clinics because clinics.owner_id references it)
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  contact TEXT,
  clinic_id UUID,  -- FK added after clinics table is created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- clinics
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinics (
  clinic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  address TEXT,
  owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from users.clinic_id to clinics (deferred to avoid circular dependency)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_clinic_id_fkey;
ALTER TABLE users
  ADD CONSTRAINT users_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────────────
-- clinic_join_requests
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinic_join_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate pending requests from the same user for the same clinic
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_join_requests_unique_pending
  ON clinic_join_requests(user_id, clinic_id)
  WHERE status = 'pending';

-- ───────────────────────────────────────────────────────────────────
-- patients
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(user_id) ON DELETE RESTRICT,
  modified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────────
-- appointments
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  duration_in_minutes INTEGER NOT NULL,
  is_emergency BOOLEAN DEFAULT FALSE,
  is_follow_up_pending BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('pending', 'confirm', 'cancel')) DEFAULT 'pending',
  did_show_up BOOLEAN,
  created_by UUID REFERENCES users(user_id) ON DELETE RESTRICT,
  modified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  booked_via TEXT CHECK (booked_via IN ('staff', 'patient')) DEFAULT 'staff'
);

-- Prevent double booking: no overlapping non-emergency, non-cancelled appointments
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS no_overlapping_appointments;
ALTER TABLE appointments
  ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING gist (
    clinic_id WITH =,
    tstzrange(start_datetime, end_datetime) WITH &&
  )
  WHERE (status IN ('pending', 'confirm') AND (is_emergency IS FALSE OR is_emergency IS NULL));

-- ───────────────────────────────────────────────────────────────────
-- Indexes (retained essential ones from migrations)
-- ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status_start ON appointments(status, start_datetime);

-- ───────────────────────────────────────────────────────────────────
-- updated_at triggers
-- ───────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS tr_users_updated_at ON users;
CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_clinics_updated_at ON clinics;
CREATE TRIGGER tr_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_clinic_join_requests_updated_at ON clinic_join_requests;
CREATE TRIGGER tr_clinic_join_requests_updated_at
  BEFORE UPDATE ON clinic_join_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_appointments_updated_at ON appointments;
CREATE TRIGGER tr_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Column additions for existing databases
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booked_via TEXT DEFAULT 'staff';
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_booked_via_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_booked_via_check
  CHECK (booked_via IN ('staff', 'patient'));
