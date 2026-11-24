-- Payroll rates are stored as fractions (for example, 0.054 means 5.4%).
-- Earlier payroll configurations stored CNPS rates as percentage points (5.4, 6.4).
-- Values above 1 cannot be valid fractions for these fields and are normalized.
UPDATE "payroll_configurations"
SET "cnps_employee_rate" = "cnps_employee_rate" / 100
WHERE "cnps_employee_rate" > 1;

UPDATE "payroll_configurations"
SET "cnps_employer_rate" = "cnps_employer_rate" / 100
WHERE "cnps_employer_rate" > 1;

ALTER TABLE "payroll_configurations"
  ALTER COLUMN "cnps_employee_rate" SET DEFAULT 0.054,
  ALTER COLUMN "cnps_employer_rate" SET DEFAULT 0.064;
