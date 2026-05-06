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

-- CreateIndex
CREATE INDEX "notifications_recipient_id_recipient_type_read_idx" ON "public"."notifications"("recipient_id", "recipient_type", "read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");
