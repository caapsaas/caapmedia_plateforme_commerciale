-- CreateEnum
CREATE TYPE "SalaryComponentType" AS ENUM ('EARNING', 'DEDUCTION', 'TAX', 'CONTRIBUTION');

-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('EMPLOYEE', 'EMPLOYER', 'BOTH');

-- CreateTable
CREATE TABLE "payroll_configurations" (
    "id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "min_wage" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "min_wage_period" VARCHAR(50) NOT NULL DEFAULT 'monthly',
    "min_wage_effective_date" TIMESTAMP(3) NOT NULL,
    "cnps_employee_rate" DECIMAL(5,2) NOT NULL DEFAULT 5.4,
    "cnps_employer_rate" DECIMAL(5,2) NOT NULL DEFAULT 6.4,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_components" (
    "id" TEXT NOT NULL,
    "payroll_config_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "SalaryComponentType" NOT NULL,
    "rate" DECIMAL(5,2),
    "fixed_amount" DECIMAL(12,2),
    "contribution_type" "ContributionType",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_brackets" (
    "id" TEXT NOT NULL,
    "payroll_config_id" TEXT NOT NULL,
    "min_salary" DECIMAL(12,2) NOT NULL,
    "max_salary" DECIMAL(12,2),
    "rate" DECIMAL(5,2) NOT NULL,
    "deductible" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allowance_rules" (
    "id" TEXT NOT NULL,
    "payroll_config_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "min_salary" DECIMAL(12,2),
    "number_of_dependents" INTEGER,
    "amount" DECIMAL(12,2),
    "percentage_of_salary" DECIMAL(5,2),
    "effective_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allowance_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_configurations_subsidiary_id_key" ON "payroll_configurations"("subsidiary_id");

-- CreateIndex
CREATE INDEX "salary_components_payroll_config_id_idx" ON "salary_components"("payroll_config_id");

-- CreateIndex
CREATE INDEX "tax_brackets_payroll_config_id_effective_date_idx" ON "tax_brackets"("payroll_config_id", "effective_date");

-- CreateIndex
CREATE INDEX "allowance_rules_payroll_config_id_effective_date_idx" ON "allowance_rules"("payroll_config_id", "effective_date");

-- AddForeignKey
ALTER TABLE "payroll_configurations" ADD CONSTRAINT "payroll_configurations_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_payroll_config_id_fkey" FOREIGN KEY ("payroll_config_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_brackets" ADD CONSTRAINT "tax_brackets_payroll_config_id_fkey" FOREIGN KEY ("payroll_config_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allowance_rules" ADD CONSTRAINT "allowance_rules_payroll_config_id_fkey" FOREIGN KEY ("payroll_config_id") REFERENCES "payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
