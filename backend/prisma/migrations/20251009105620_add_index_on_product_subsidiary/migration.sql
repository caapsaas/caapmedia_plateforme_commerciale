/*
  Warnings:

  - You are about to drop the column `account` on the `financial_transactions` table. All the data in the column will be lost.
  - Added the required column `treasury_account_id` to the `financial_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."financial_transactions" DROP COLUMN "account",
ADD COLUMN     "treasury_account_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "products_subsidiary_id_idx" ON "public"."products"("subsidiary_id");

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_treasury_account_id_fkey" FOREIGN KEY ("treasury_account_id") REFERENCES "public"."treasury_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
