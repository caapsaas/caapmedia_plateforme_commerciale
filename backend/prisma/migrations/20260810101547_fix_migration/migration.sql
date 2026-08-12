/*
  Warnings:

  - You are about to drop the column `assembly_price` on the `order_item` table. All the data in the column will be lost.
  - Made the column `subsidiary_id` on table `dynamic_tokens` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "public"."AccountType" ADD VALUE 'CAISSE';

-- AlterTable
ALTER TABLE "public"."dynamic_tokens" ALTER COLUMN "subsidiary_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."order_item" DROP COLUMN "assembly_price";

-- CreateTable
CREATE TABLE "public"."credit_account" (
    "id" TEXT NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "last_payment_date" TIMESTAMP(3) NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,

    CONSTRAINT "credit_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_account_contact_id_key" ON "public"."credit_account"("contact_id");

-- AddForeignKey
ALTER TABLE "public"."credit_account" ADD CONSTRAINT "credit_account_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_account" ADD CONSTRAINT "credit_account_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
