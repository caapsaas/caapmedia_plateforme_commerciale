-- CreateEnum
CREATE TYPE "TreasuryTransactionType" AS ENUM ('INFLOW', 'OUTFLOW', 'BANK_WITHDRAWAL', 'CASH_REFILL', 'SUPPLIER_PAYMENT', 'SALARY_PAYMENT', 'BONUS_PAYMENT', 'TAX_PAYMENT', 'RENT', 'UTILITIES', 'MARKETING', 'SUPPLIES', 'PURCHASE_COST', 'OTHER_EXPENSE');

-- CreateEnum
CREATE TYPE "CounterpartyType" AS ENUM ('SUPPLIER', 'TAX_AUTHORITY', 'INDIVIDUAL', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AccountType" ADD VALUE 'SAFE';
ALTER TYPE "AccountType" ADD VALUE 'EXPENSE_BOX';
ALTER TYPE "AccountType" ADD VALUE 'CASH_REGISTER';

-- AlterTable
ALTER TABLE "financial_transactions" ADD COLUMN     "balance_after_dest" DECIMAL(15,2),
ADD COLUMN     "balance_after_source" DECIMAL(15,2),
ADD COLUMN     "counterparty_id" TEXT,
ADD COLUMN     "destination_account_id" TEXT,
ADD COLUMN     "reference" VARCHAR(100),
ADD COLUMN     "source_account_id" TEXT,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'VALIDE',
ADD COLUMN     "treasury_type" "TreasuryTransactionType";

-- AlterTable
ALTER TABLE "treasury_accounts" ADD COLUMN     "account_code" TEXT,
ADD COLUMN     "account_number" VARCHAR(50),
ADD COLUMN     "cashier_id" TEXT,
ADD COLUMN     "initial_balance" DECIMAL(15,2);

-- CreateTable
CREATE TABLE "counterparties" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "CounterpartyType" NOT NULL,
    "tax_number" VARCHAR(100),
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "counterparties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "counterparties_subsidiary_id_type_idx" ON "counterparties"("subsidiary_id", "type");

-- CreateIndex
CREATE INDEX "financial_transactions_source_account_id_idx" ON "financial_transactions"("source_account_id");

-- CreateIndex
CREATE INDEX "financial_transactions_destination_account_id_idx" ON "financial_transactions"("destination_account_id");

-- CreateIndex
CREATE INDEX "financial_transactions_status_idx" ON "financial_transactions"("status");

-- CreateIndex
CREATE INDEX "treasury_accounts_cashier_id_idx" ON "treasury_accounts"("cashier_id");

-- AddForeignKey
ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "treasury_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_destination_account_id_fkey" FOREIGN KEY ("destination_account_id") REFERENCES "treasury_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
