-- CreateEnum
CREATE TYPE "public"."PayrollBonusStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PayrollChargePaymentStatus" AS ENUM ('ACCRUED', 'DUE', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PayrollEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- AlterTable
ALTER TABLE "public"."meetings" ALTER COLUMN "meeting_date_time" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."secretariat_tasks" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."payroll_bonus_types" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "is_subject_to_cnps" BOOLEAN NOT NULL DEFAULT true,
    "is_subject_to_cfc" BOOLEAN NOT NULL DEFAULT true,
    "calculation_method" VARCHAR(50),
    "payment_timing" VARCHAR(50),
    "subsidiary_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_bonus_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_bonuses" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "bonus_type_id" TEXT NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "cnps_deduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cfc_deduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "irpp_deduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cac_deduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "period" VARCHAR(7) NOT NULL,
    "status" "public"."PayrollBonusStatus" NOT NULL DEFAULT 'PENDING',
    "payment_date" TIMESTAMP(3),
    "bank_transfer_id" TEXT,
    "journal_entry_id" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "subsidiary_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_charge_payments" (
    "id" TEXT NOT NULL,
    "charge_type" VARCHAR(50) NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "public"."PayrollChargePaymentStatus" NOT NULL DEFAULT 'ACCRUED',
    "due_date" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3),
    "declaration_number" VARCHAR(100),
    "declaration_date" TIMESTAMP(3),
    "bank_transfer_id" VARCHAR(100),
    "bank_reference" TEXT,
    "accrual_journal_entry_id" TEXT,
    "payment_journal_entry_id" TEXT,
    "notes" TEXT,
    "subsidiary_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_charge_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_journal_entries" (
    "id" TEXT NOT NULL,
    "payroll_record_id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "status" "public"."PayrollEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "entry_type" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_bonus_types_code_key" ON "public"."payroll_bonus_types"("code");

-- CreateIndex
CREATE INDEX "payroll_bonus_types_subsidiary_id_idx" ON "public"."payroll_bonus_types"("subsidiary_id");

-- CreateIndex
CREATE INDEX "payroll_bonus_types_code_idx" ON "public"."payroll_bonus_types"("code");

-- CreateIndex
CREATE INDEX "payroll_bonuses_subsidiary_id_status_idx" ON "public"."payroll_bonuses"("subsidiary_id", "status");

-- CreateIndex
CREATE INDEX "payroll_bonuses_period_status_idx" ON "public"."payroll_bonuses"("period", "status");

-- CreateIndex
CREATE INDEX "payroll_bonuses_employee_id_idx" ON "public"."payroll_bonuses"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_bonuses_employee_id_bonus_type_id_period_key" ON "public"."payroll_bonuses"("employee_id", "bonus_type_id", "period");

-- CreateIndex
CREATE INDEX "payroll_charge_payments_subsidiary_id_status_due_date_idx" ON "public"."payroll_charge_payments"("subsidiary_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "payroll_charge_payments_month_idx" ON "public"."payroll_charge_payments"("month");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_charge_payments_subsidiary_id_charge_type_month_key" ON "public"."payroll_charge_payments"("subsidiary_id", "charge_type", "month");

-- CreateIndex
CREATE INDEX "payroll_journal_entries_payroll_record_id_idx" ON "public"."payroll_journal_entries"("payroll_record_id");

-- CreateIndex
CREATE INDEX "payroll_journal_entries_journal_entry_id_idx" ON "public"."payroll_journal_entries"("journal_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_journal_entries_payroll_record_id_journal_entry_id_key" ON "public"."payroll_journal_entries"("payroll_record_id", "journal_entry_id");

-- AddForeignKey
ALTER TABLE "public"."payroll_bonus_types" ADD CONSTRAINT "payroll_bonus_types_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_bonuses" ADD CONSTRAINT "payroll_bonuses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_bonuses" ADD CONSTRAINT "payroll_bonuses_bonus_type_id_fkey" FOREIGN KEY ("bonus_type_id") REFERENCES "public"."payroll_bonus_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_bonuses" ADD CONSTRAINT "payroll_bonuses_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_bonuses" ADD CONSTRAINT "payroll_bonuses_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_charge_payments" ADD CONSTRAINT "payroll_charge_payments_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_charge_payments" ADD CONSTRAINT "payroll_charge_payments_accrual_journal_entry_id_fkey" FOREIGN KEY ("accrual_journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_charge_payments" ADD CONSTRAINT "payroll_charge_payments_payment_journal_entry_id_fkey" FOREIGN KEY ("payment_journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_journal_entries" ADD CONSTRAINT "payroll_journal_entries_payroll_record_id_fkey" FOREIGN KEY ("payroll_record_id") REFERENCES "public"."payroll_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_journal_entries" ADD CONSTRAINT "payroll_journal_entries_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
