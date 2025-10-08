/*
  Warnings:

  - A unique constraint covering the columns `[contact_id]` on the table `credit_account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contact_id` to the `credit_account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_method` to the `sale` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."customer_payment_method" AS ENUM ('CASH', 'CARD', 'CHECK', 'MOBILE_MONEY', 'PAYCAAP', 'PAY_ON_DELIVERY', 'CUSTOMER_CREDIT');

-- AlterTable
ALTER TABLE "public"."credit_account" ADD COLUMN     "contact_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "payment_method" "public"."customer_payment_method";

-- AlterTable
ALTER TABLE "public"."sale" ADD COLUMN     "order_id" UUID,
ADD COLUMN     "payment_method" "public"."customer_payment_method" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "credit_account_contact_id_key" ON "public"."credit_account"("contact_id");

-- AddForeignKey
ALTER TABLE "public"."sale" ADD CONSTRAINT "sale_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_account" ADD CONSTRAINT "credit_account_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
