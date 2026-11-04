-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LeaveType" ADD VALUE 'PERSONAL';
ALTER TYPE "public"."LeaveType" ADD VALUE 'MATERNITY';
ALTER TYPE "public"."LeaveType" ADD VALUE 'PATERNITY';
ALTER TYPE "public"."LeaveType" ADD VALUE 'OTHER';

-- CreateTable
CREATE TABLE "public"."employee_leave_balances" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "leave_type" "public"."LeaveType" NOT NULL,
    "days" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_leave_balances_employee_id_idx" ON "public"."employee_leave_balances"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_leave_balances_employee_id_leave_type_key" ON "public"."employee_leave_balances"("employee_id", "leave_type");

-- AddForeignKey
ALTER TABLE "public"."employee_leave_balances" ADD CONSTRAINT "employee_leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
