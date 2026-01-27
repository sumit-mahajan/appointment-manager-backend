-- Modify the no_overlapping_appointments constraint to allow emergency appointments to override
-- We do this by adding 'is_emergency = false' to the WHERE clause of the exclusion constraint.
-- This means the constraint only applies to non-emergency appointments.

ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS no_overlapping_appointments;

ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
  clinic_id WITH =,
  tstzrange(start_datetime, end_datetime) WITH &&
)
WHERE (status IN ('pending', 'confirm') AND (is_emergency IS FALSE OR is_emergency IS NULL));
