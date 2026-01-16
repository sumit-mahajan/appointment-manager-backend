-- Add end_datetime and updated_at columns
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS tr_appointments_updated_at ON appointments;
CREATE TRIGGER tr_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop redundant individual indexes
DROP INDEX IF EXISTS idx_appointments_start_datetime;
DROP INDEX IF EXISTS idx_appointments_status;

-- Create composite indexes for optimized range and status-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_time ON appointments (start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status_start ON appointments (status, start_datetime);
