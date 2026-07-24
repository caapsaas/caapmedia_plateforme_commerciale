-- Chantier 2 : unités et conversions. Un produit de stock a une unité de base
-- (celle dans laquelle son stock est réellement compté) et éventuellement
-- plusieurs unités d'emballage/achat, chacune avec un facteur de conversion
-- vers l'unité de base.

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(20),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");

-- CreateTable
CREATE TABLE "item_packaging_units" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "item_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "conversion_factor" DECIMAL(15,4) NOT NULL,

    CONSTRAINT "item_packaging_units_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "item_packaging_units_item_id_unit_id_key" ON "item_packaging_units"("item_id", "unit_id");

-- AddForeignKey
ALTER TABLE "item_packaging_units" ADD CONSTRAINT "item_packaging_units_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "item_packaging_units" ADD CONSTRAINT "item_packaging_units_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: unité de base d'un article (Item)
ALTER TABLE "items" ADD COLUMN "base_unit_id" TEXT;
ALTER TABLE "items" ADD CONSTRAINT "items_base_unit_id_fkey" FOREIGN KEY ("base_unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: unité d'achat d'une ligne de bon de commande
ALTER TABLE "purchase_order_items" ADD COLUMN "purchase_unit_id" TEXT;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_unit_id_fkey" FOREIGN KEY ("purchase_unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
