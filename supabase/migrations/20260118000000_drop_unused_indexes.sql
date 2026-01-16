-- Drop unused indexes, keeping only clinic_id indexes on patients and appointments
-- These are essential for multi-tenant filtering queries

-- Drop users table indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_clinic_id;

-- Drop clinics table indexes
DROP INDEX IF EXISTS idx_clinics_owner_id;

-- Drop clinic_join_requests table indexes
DROP INDEX IF EXISTS idx_clinic_join_requests_user_id;
DROP INDEX IF EXISTS idx_clinic_join_requests_clinic_id;
DROP INDEX IF EXISTS idx_clinic_join_requests_status;
DROP INDEX IF EXISTS idx_clinic_join_requests_clinic_status;

-- Drop patients table audit indexes (keeping clinic_id)
DROP INDEX IF EXISTS idx_patients_created_by;
DROP INDEX IF EXISTS idx_patients_modified_by;

-- Drop appointments table audit indexes (keeping clinic_id)
DROP INDEX IF EXISTS idx_appointments_created_by;
DROP INDEX IF EXISTS idx_appointments_modified_by;

-- Note: Keeping idx_patients_clinic_id and idx_appointments_clinic_id
-- as they are essential for multi-tenant filtering queries
