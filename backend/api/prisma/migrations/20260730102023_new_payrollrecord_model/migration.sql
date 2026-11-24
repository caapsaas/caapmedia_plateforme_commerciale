/*
  Warnings:

  - A unique constraint covering the columns `[employee_id,payroll_period]` on the table `payroll_records` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `base_salary` to the `payroll_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `payroll_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."payroll_records" ADD COLUMN     "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "base_salary" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "bonus" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cac" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "calculation_meta" JSONB,
ADD COLUMN     "cfc_employee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cfc_employer" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cnps_employee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cnps_employer" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deductions_detail" JSONB,
ADD COLUMN     "fne" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "irpp" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "other_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "other_earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "overtime" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_employer_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "payroll_records_payroll_period_idx" ON "public"."payroll_records"("payroll_period");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_records_employee_id_payroll_period_key" ON "public"."payroll_records"("employee_id", "payroll_period");
