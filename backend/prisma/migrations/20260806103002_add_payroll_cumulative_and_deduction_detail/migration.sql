-- CreateTable
CREATE TABLE "public"."payroll_cumulatives" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "year" VARCHAR(4) NOT NULL,
    "month" VARCHAR(7),
    "gross_cumulative" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deductions_cumulative" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_cumulative" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cnps_cumulative" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cfc_cumulative" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "irpp_cumulative" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cac_cumulative" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "last_payroll_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_cumulatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_deduction_details" (
    "id" TEXT NOT NULL,
    "payroll_record_id" TEXT NOT NULL,
    "deduction_type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "base_amount" DECIMAL(12,2) NOT NULL,
    "rate_applied" DECIMAL(5,4) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_deduction_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_cumulatives_employee_id_year_idx" ON "public"."payroll_cumulatives"("employee_id", "year");

-- CreateIndex
CREATE INDEX "payroll_cumulatives_subsidiary_id_year_idx" ON "public"."payroll_cumulatives"("subsidiary_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_cumulatives_employee_id_year_month_key" ON "public"."payroll_cumulatives"("employee_id", "year", "month");

-- CreateIndex
CREATE INDEX "payroll_deduction_details_payroll_record_id_idx" ON "public"."payroll_deduction_details"("payroll_record_id");

-- CreateIndex
CREATE INDEX "payroll_deduction_details_deduction_type_idx" ON "public"."payroll_deduction_details"("deduction_type");

-- AddForeignKey
ALTER TABLE "public"."payroll_cumulatives" ADD CONSTRAINT "payroll_cumulatives_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_cumulatives" ADD CONSTRAINT "payroll_cumulatives_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_deduction_details" ADD CONSTRAINT "payroll_deduction_details_payroll_record_id_fkey" FOREIGN KEY ("payroll_record_id") REFERENCES "public"."payroll_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
