-- Enable btree_gist extension for EXCLUDE constraint with UUID
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create users table (without clinic_id FK initially due to circular dependency)
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  contact TEXT,
  clinic_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
  clinic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  address TEXT,
  owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add FK constraint from users.clinic_id to clinics (after both tables exist)
ALTER TABLE users 
ADD CONSTRAINT users_clinic_id_fkey 
FOREIGN KEY (clinic_id) REFERENCES clinics(clinic_id) ON DELETE SET NULL;

-- Create clinic_join_requests table
CREATE TABLE IF NOT EXISTS clinic_join_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partial unique index to prevent duplicate pending requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_join_requests_unique_pending 
ON clinic_join_requests(user_id, clinic_id) 
WHERE status = 'pending';

-- Add clinic_id, created_by, modified_by to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(user_id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES users(user_id) ON DELETE SET NULL;

-- Add clinic_id, created_by, modified_by to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(clinic_id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(user_id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES users(user_id) ON DELETE SET NULL;

-- Create updated_at trigger function (reuse existing if exists, otherwise create)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers for new tables
DROP TRIGGER IF EXISTS tr_users_updated_at ON users;
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_clinics_updated_at ON clinics;
CREATE TRIGGER tr_clinics_updated_at
    BEFORE UPDATE ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_clinic_join_requests_updated_at ON clinic_join_requests;
CREATE TRIGGER tr_clinic_join_requests_updated_at
    BEFORE UPDATE ON clinic_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);

-- Create indexes for clinics table
CREATE INDEX IF NOT EXISTS idx_clinics_owner_id ON clinics(owner_id);

-- Create indexes for clinic_join_requests table
CREATE INDEX IF NOT EXISTS idx_clinic_join_requests_user_id ON clinic_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_join_requests_clinic_id ON clinic_join_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_join_requests_status ON clinic_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_clinic_join_requests_clinic_status ON clinic_join_requests(clinic_id, status);

-- Create indexes for patients table (new columns)
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_modified_by ON patients(modified_by);

-- Create indexes for appointments table (new columns)
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_modified_by ON appointments(modified_by);

-- Add EXCLUDE constraint to prevent double bookings
-- This ensures no two appointments can have overlapping time ranges within the same clinic
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS no_overlapping_appointments;

ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
  clinic_id WITH =,
  tstzrange(start_datetime, end_datetime) WITH &&
)
WHERE (status IN ('pending', 'confirm'));
