/*
  Warnings:

  - You are about to drop the column `related_document_url` on the `external_financial_transactions` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ExternalTransactionType" ADD VALUE 'INVESTMENT_RETURN';
ALTER TYPE "public"."ExternalTransactionType" ADD VALUE 'TAX_REFUND';
ALTER TYPE "public"."ExternalTransactionType" ADD VALUE 'INSURANCE_PAYOUT';
ALTER TYPE "public"."ExternalTransactionType" ADD VALUE 'LEGAL_SETTLEMENT';

-- AlterTable
ALTER TABLE "public"."external_financial_transactions" DROP COLUMN "related_document_url";
