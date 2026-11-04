/*
  Warnings:

  - A unique constraint covering the columns `[account_name,subsidiary_id]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_name_subsidiary_id_key" ON "public"."accounts"("account_name", "subsidiary_id");
