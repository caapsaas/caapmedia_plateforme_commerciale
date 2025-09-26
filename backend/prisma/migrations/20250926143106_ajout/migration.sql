-- CreateTable
CREATE TABLE "public"."absence_records" (
    "id" TEXT NOT NULL,
    "employee_name" VARCHAR(255) NOT NULL,
    "type_absence" "public"."absence_type" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "document_url" TEXT,
    "employee_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "absence_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" TEXT NOT NULL,
    "employee_name" VARCHAR(255) NOT NULL,
    "attendance_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."attendance_status" NOT NULL,
    "arrival_time" TIMESTAMP(3),
    "departure_time" TIMESTAMP(3),
    "break_start_time" TIMESTAMP(3),
    "break_end_time" TIMESTAMP(3),
    "signature" TEXT,
    "employee_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_records" (
    "id" TEXT NOT NULL,
    "employee_name" VARCHAR(255) NOT NULL,
    "payroll_period" VARCHAR(7) NOT NULL,
    "gross_salary" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "payment_date" TIMESTAMP(3),
    "status" "public"."payroll_status" NOT NULL,
    "signature" TEXT,
    "employee_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supplier_debts" (
    "id" TEXT NOT NULL,
    "supplier_name" VARCHAR(255) NOT NULL,
    "invoice_id" VARCHAR(50) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "public"."debt_status" NOT NULL,
    "invoice_url" TEXT,
    "subsidiary_id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,

    CONSTRAINT "supplier_debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expense_records" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."expense_category" NOT NULL,
    "expense_record_type" "public"."expense_type" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "expense_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."absence_records" ADD CONSTRAINT "absence_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."absence_records" ADD CONSTRAINT "absence_records_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_records" ADD CONSTRAINT "payroll_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_records" ADD CONSTRAINT "payroll_records_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_debts" ADD CONSTRAINT "supplier_debts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_debts" ADD CONSTRAINT "supplier_debts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_records" ADD CONSTRAINT "expense_records_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
