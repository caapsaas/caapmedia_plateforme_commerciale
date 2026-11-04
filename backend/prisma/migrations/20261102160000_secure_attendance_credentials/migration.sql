CREATE TABLE "attendance_credentials" (
  "employee_id" TEXT NOT NULL,
  "pin_hash" TEXT NOT NULL,
  "failed_attempts" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMP(3),
  "updated_by" TEXT NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendance_credentials_pkey" PRIMARY KEY ("employee_id"),
  CONSTRAINT "attendance_credentials_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Revoke the previously permanent QR codes. No employee attendance data is changed.
UPDATE "dynamic_tokens" SET "is_used" = true, "used_at" = CURRENT_TIMESTAMP WHERE "is_used" = false;
