-- Add geolocation fields to Subsidiary
ALTER TABLE "subsidiaries" ADD COLUMN IF NOT EXISTS "latitude" FLOAT;
ALTER TABLE "subsidiaries" ADD COLUMN IF NOT EXISTS "longitude" FLOAT;
ALTER TABLE "subsidiaries" ADD COLUMN IF NOT EXISTS "geofence_radius" INTEGER NOT NULL DEFAULT 100;

-- Create index for geolocation queries
CREATE INDEX IF NOT EXISTS "idx_subsidiaries_geolocation" ON "subsidiaries"("latitude", "longitude");

-- Add geolocation fields to AttendanceRecord
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "arrival_latitude" FLOAT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "arrival_longitude" FLOAT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "departure_latitude" FLOAT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "departure_longitude" FLOAT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "is_geolocation_valid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "accuracy_meters" FLOAT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "qr_code_token" VARCHAR(500);

-- Create unique index for QR code token
CREATE UNIQUE INDEX IF NOT EXISTS "idx_attendance_records_qr_code_token" ON "attendance_records"("qr_code_token") WHERE "qr_code_token" IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_attendance_records_employee_date" ON "attendance_records"("employee_id", "attendance_date");
CREATE INDEX IF NOT EXISTS "idx_attendance_records_geolocation" ON "attendance_records"("arrival_latitude", "arrival_longitude");

-- Add new attendance statuses (only if they don't exist)
DO $$
BEGIN
  BEGIN
    ALTER TYPE "AttendanceStatus" ADD VALUE 'LATE' AFTER 'PRESENT';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TYPE "AttendanceStatus" ADD VALUE 'ABSENT' AFTER 'LATE';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TYPE "AttendanceStatus" ADD VALUE 'LEFT' AFTER 'ABSENT';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER TYPE "AttendanceStatus" ADD VALUE 'LEFT_OUTSIDE_GEOFENCE' AFTER 'LEFT';
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;

-- Create DailyQrCode table
CREATE TABLE IF NOT EXISTS "daily_qr_codes" (
  "id" TEXT NOT NULL,
  "subsidiary_id" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,

  PRIMARY KEY ("id"),
  CONSTRAINT "daily_qr_codes_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for DailyQrCode
CREATE INDEX IF NOT EXISTS "idx_daily_qr_codes_subsidiary_active" ON "daily_qr_codes"("subsidiary_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_daily_qr_codes_expires_at" ON "daily_qr_codes"("expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_daily_qr_codes_token" ON "daily_qr_codes"("token");
