/*
  Warnings:

  - You are about to alter the column `cnps_employee_rate` on the `payroll_configurations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `Decimal(5,4)`.
  - You are about to alter the column `cnps_employer_rate` on the `payroll_configurations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `Decimal(5,4)`.

*/
-- AlterTable
ALTER TABLE "payroll_configurations" ALTER COLUMN "cnps_employee_rate" SET DEFAULT 0.042,
ALTER COLUMN "cnps_employee_rate" SET DATA TYPE DECIMAL(5,4),
ALTER COLUMN "cnps_employer_rate" SET DEFAULT 0.042,
ALTER COLUMN "cnps_employer_rate" SET DATA TYPE DECIMAL(5,4);
