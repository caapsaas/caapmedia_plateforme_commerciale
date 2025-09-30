/*
  Warnings:

  - A unique constraint covering the columns `[option_name]` on the table `configurable_option_item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "configurable_option_item_option_name_key" ON "public"."configurable_option_item"("option_name");
