-- CreateEnum
CREATE TYPE "BankType" AS ENUM ('COMMERCIAL_BANK', 'PUBLIC_BANK');

-- AlterTable
ALTER TABLE "treasury_accounts" ADD COLUMN     "bank_id" TEXT;

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "BankType" NOT NULL DEFAULT 'COMMERCIAL_BANK',

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banks_name_key" ON "banks"("name");

-- CreateIndex
CREATE INDEX "treasury_accounts_bank_id_idx" ON "treasury_accounts"("bank_id");

-- AddForeignKey
ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
