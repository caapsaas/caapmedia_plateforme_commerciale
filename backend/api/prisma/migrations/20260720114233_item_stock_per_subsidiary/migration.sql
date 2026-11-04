-- Un produit de stock (Item.type=STOCK_PRODUCT) devient un article global,
-- comme un service : "stock" et "warehouse" ne sont plus des colonnes de
-- l'Item lui-même mais vivent dans une table séparée par filiale (ItemStock).
-- Seule "Douala" a des produits de stock aujourd'hui (vérifié avant migration :
-- 48 items, 0 doublon de nom, 1 seule filiale) donc la reprise de données est
-- une simple copie 1:1, sans fusion à faire.

-- CreateTable
CREATE TABLE "item_stocks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "item_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "stock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "warehouse" VARCHAR(255),

    CONSTRAINT "item_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_stocks_item_id_subsidiary_id_key" ON "item_stocks"("item_id", "subsidiary_id");
CREATE INDEX "item_stocks_subsidiary_id_idx" ON "item_stocks"("subsidiary_id");

-- AddForeignKey
ALTER TABLE "item_stocks" ADD CONSTRAINT "item_stocks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "item_stocks" ADD CONSTRAINT "item_stocks_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate data: un ItemStock par produit de stock existant, reprenant son
-- stock/entrepôt/filiale actuels tels quels.
INSERT INTO "item_stocks" ("item_id", "subsidiary_id", "stock", "warehouse")
SELECT "id", "subsidiary_id", COALESCE("stock", 0), "warehouse"
FROM "items"
WHERE "type" = 'STOCK_PRODUCT' AND "subsidiary_id" IS NOT NULL;

-- DropForeignKey + DropIndex (ancien rattachement filiale direct sur Item)
ALTER TABLE "items" DROP CONSTRAINT IF EXISTS "items_subsidiary_id_fkey";
DROP INDEX IF EXISTS "items_subsidiary_id_idx";
DROP INDEX IF EXISTS "items_subsidiary_id_stock_idx";

-- DropColumn
ALTER TABLE "items" DROP COLUMN IF EXISTS "stock";
ALTER TABLE "items" DROP COLUMN IF EXISTS "warehouse";
ALTER TABLE "items" DROP COLUMN IF EXISTS "subsidiary_id";

-- Un article (service ou produit de stock) est désormais unique par (nom, type)
-- dans tout le catalogue global — plus de doublon filiale par filiale.
ALTER TABLE "items" ADD CONSTRAINT "items_name_type_key" UNIQUE ("name", "type");
