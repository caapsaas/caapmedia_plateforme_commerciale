-- CreateEnum
CREATE TYPE "CashRemittanceStatus" AS ENUM ('SUBMITTED', 'RECEIVED', 'RECEIVED_WITH_DISCREPANCY', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TreasuryTransactionType" ADD VALUE 'IRPP_PAYMENT';
ALTER TYPE "TreasuryTransactionType" ADD VALUE 'CNPS_PAYMENT';
ALTER TYPE "TreasuryTransactionType" ADD VALUE 'CFC_FNE_PAYMENT';
ALTER TYPE "TreasuryTransactionType" ADD VALUE 'TVA_PAYMENT';

-- CreateTable
CREATE TABLE "cash_remittances" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "declared_amount" DECIMAL(15,2) NOT NULL,
    "received_amount" DECIMAL(15,2),
    "discrepancy" DECIMAL(15,2),
    "remittance_date" TIMESTAMP(3) NOT NULL,
    "status" "CashRemittanceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "source_cash_register_id" TEXT NOT NULL,
    "destination_safe_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "received_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_remittances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_remittances_reference_key" ON "cash_remittances"("reference");

-- CreateIndex
CREATE INDEX "cash_remittances_subsidiary_id_status_idx" ON "cash_remittances"("subsidiary_id", "status");

-- CreateIndex
CREATE INDEX "cash_remittances_source_cash_register_id_idx" ON "cash_remittances"("source_cash_register_id");

-- AddForeignKey
ALTER TABLE "cash_remittances" ADD CONSTRAINT "cash_remittances_source_cash_register_id_fkey" FOREIGN KEY ("source_cash_register_id") REFERENCES "treasury_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_remittances" ADD CONSTRAINT "cash_remittances_destination_safe_id_fkey" FOREIGN KEY ("destination_safe_id") REFERENCES "treasury_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_remittances" ADD CONSTRAINT "cash_remittances_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_remittances" ADD CONSTRAINT "cash_remittances_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_remittances" ADD CONSTRAINT "cash_remittances_received_by_user_id_fkey" FOREIGN KEY ("received_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
