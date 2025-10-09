/*
  Warnings:

  - A unique constraint covering the columns `[supplier_name,subsidiary_id]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplier_name_subsidiary_id_key" ON "public"."suppliers"("supplier_name", "subsidiary_id");
