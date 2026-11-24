/*
  Warnings:

  - Added the required column `recipient_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_type` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('NEW_ORDER', 'ORDER_STATUS', 'PAYMENT_RECEIVED', 'LOW_STOCK', 'SYSTEM_ALERT', 'EXTERNAL_TRANSACTION_VALIDATED', 'EXTERNAL_TRANSACTION_CREATED', 'EXTERNAL_TRANSACTION_CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RecipientType" AS ENUM ('USER', 'CLIENT');

-- CreateEnum
CREATE TYPE "public"."PrefinancementTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "public"."PrefinancementCategory" AS ENUM ('MATERIELS_PREMIER', 'MAIN_D_OEUVRE', 'ENERGIE', 'TRANSPORT', 'AUTRE');

-- CreateEnum
CREATE TYPE "public"."PrefinancementStatus" AS ENUM ('EN_ATTENTE', 'VALIDE', 'ANNULE');

-- AlterEnum
ALTER TYPE "public"."ExternalTransactionCategory" ADD VALUE 'TRANSFER_PDG';

-- AlterEnum
ALTER TYPE "public"."ExternalTransactionType" ADD VALUE 'TRANSFER_PDG';

-- AlterTable
ALTER TABLE "public"."notifications" ADD COLUMN     "order_id" UUID,
ADD COLUMN     "recipient_id" UUID NOT NULL,
ADD COLUMN     "recipient_type" "public"."RecipientType" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "public"."NotificationType" NOT NULL,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."PrefinancementAccount" (
    "prefinancement_accounts" TEXT NOT NULL,
    "account_name" VARCHAR(255) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'XOF',
    "last_updated" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subsidiary_id" UUID NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "userId" UUID,

    CONSTRAINT "PrefinancementAccount_pkey" PRIMARY KEY ("prefinancement_accounts")
);

-- CreateTable
CREATE TABLE "public"."PrefinancementTransaction" (
    "prefinancement_transactions" TEXT NOT NULL,
    "date" TIMESTAMP NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "public"."PrefinancementTransactionType" NOT NULL,
    "category" "public"."PrefinancementCategory" NOT NULL,
    "status" "public"."PrefinancementStatus" NOT NULL,
    "reference_number" VARCHAR(100),
    "related_order_id" VARCHAR(255),
    "notes" TEXT,
    "subsidiary_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "PrefinancementTransaction_pkey" PRIMARY KEY ("prefinancement_transactions")
);

-- CreateIndex
CREATE INDEX "notifications_recipient_id_recipient_type_read_idx" ON "public"."notifications"("recipient_id", "recipient_type", "read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- AddForeignKey
ALTER TABLE "public"."PrefinancementAccount" ADD CONSTRAINT "PrefinancementAccount_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrefinancementAccount" ADD CONSTRAINT "PrefinancementAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrefinancementTransaction" ADD CONSTRAINT "PrefinancementTransaction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrefinancementTransaction" ADD CONSTRAINT "PrefinancementTransaction_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
