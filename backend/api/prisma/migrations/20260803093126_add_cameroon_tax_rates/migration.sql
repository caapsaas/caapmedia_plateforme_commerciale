-- AlterTable
ALTER TABLE "public"."payroll_configurations" ADD COLUMN     "cfc_employee_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.01,
ADD COLUMN     "cfc_employer_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.015,
ADD COLUMN     "cnps_cap" DECIMAL(12,2) NOT NULL DEFAULT 750000,
ADD COLUMN     "fixed_abatement_annual" DECIMAL(12,2) NOT NULL DEFAULT 500000,
ADD COLUMN     "fne_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.01,
ADD COLUMN     "professional_expense_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.30,
ADD COLUMN     "risk_group_a_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.0175,
ADD COLUMN     "risk_group_b_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.025,
ADD COLUMN     "risk_group_c_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.05;
