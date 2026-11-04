-- CreateTable
CREATE TABLE "public"."leave_entitlements" (
    "id" TEXT NOT NULL,
    "payroll_config_id" TEXT NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "days_per_year" INTEGER NOT NULL,
    "is_paid" BOOLEAN NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_entitlements_payroll_config_id_idx" ON "public"."leave_entitlements"("payroll_config_id");

-- AddForeignKey
ALTER TABLE "public"."leave_entitlements" ADD CONSTRAINT "leave_entitlements_payroll_config_id_fkey" FOREIGN KEY ("payroll_config_id") REFERENCES "public"."payroll_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
