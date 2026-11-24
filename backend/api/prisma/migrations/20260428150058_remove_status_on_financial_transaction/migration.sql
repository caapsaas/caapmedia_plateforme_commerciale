/*
  Warnings:

  - You are about to drop the column `status` on the `financial_transactions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."financial_transactions_status_idx";

-- AlterTable
ALTER TABLE "public"."financial_transactions" DROP COLUMN "status";
