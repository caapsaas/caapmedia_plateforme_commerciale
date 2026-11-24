-- Chantier 1 : unification Product -> Item (SERVICE | STOCK_PRODUCT)
-- Migration écrite à la main (au lieu du diff auto Prisma) pour préserver les 93 lignes
-- existantes et toutes les FK entrantes (configurable_options, product_image,
-- opportunity_products, order_item, purchase_order_items) via un simple RENAME
-- plutôt qu'un DROP+CREATE destructeur.

-- 1. Enum du type d'article
CREATE TYPE "ItemType" AS ENUM ('SERVICE', 'STOCK_PRODUCT');

-- 2. Renommer la table (Postgres met à jour automatiquement les FK entrantes)
ALTER TABLE "products" RENAME TO "items";
ALTER TABLE "items" RENAME CONSTRAINT "products_pkey" TO "items_pkey";
ALTER TABLE "items" RENAME CONSTRAINT "products_subsidiary_id_fkey" TO "items_subsidiary_id_fkey";
ALTER INDEX "products_subsidiary_id_idx" RENAME TO "items_subsidiary_id_idx";
ALTER INDEX "products_subsidiary_id_stock_idx" RENAME TO "items_subsidiary_id_stock_idx";

-- 3. Renommer product_name -> name
ALTER TABLE "items" RENAME COLUMN "product_name" TO "name";

-- 4. Ajouter le type, le déduire de main_category, puis le rendre obligatoire
ALTER TABLE "items" ADD COLUMN "type" "ItemType";
UPDATE "items" SET "type" = 'SERVICE'
  WHERE "main_category" IN ('Imprimerie', 'Signalétique & Display', 'Objets publicitaires', 'Prestations de services');
UPDATE "items" SET "type" = 'STOCK_PRODUCT'
  WHERE "main_category" IN ('Matières Premières', 'Prestations Externes');
UPDATE "items" SET "type" = 'STOCK_PRODUCT' WHERE "type" IS NULL;
ALTER TABLE "items" ALTER COLUMN "type" SET NOT NULL;

-- 5. main_category n'a plus de raison d'être : son rôle de discriminant est repris par "type"
ALTER TABLE "items" DROP COLUMN "main_category";

-- 6. selling_price disparaît : un service n'a plus de prix catalogue, un produit de
-- stock ne garde qu'un unique "price" (prix d'achat par défaut, optionnel)
ALTER TABLE "items" DROP COLUMN IF EXISTS "selling_price";

-- 7. stock / price / warehouse / subsidiary_id ne concernent que les STOCK_PRODUCT
-- Certaines colonnes ont pu être déjà supprimées par des migrations antérieures (carelle_caapsaas)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='items' AND column_name='stock') THEN
    ALTER TABLE "items" ALTER COLUMN "stock" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='items' AND column_name='price') THEN
    ALTER TABLE "items" ALTER COLUMN "price" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='items' AND column_name='warehouse') THEN
    ALTER TABLE "items" ALTER COLUMN "warehouse" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='items' AND column_name='subsidiary_id') THEN
    ALTER TABLE "items" ALTER COLUMN "subsidiary_id" DROP NOT NULL;
  END IF;
END $$;

-- 8. Nouveaux champs
ALTER TABLE "items" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "items" ADD COLUMN "is_visible_on_site" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "items" ADD COLUMN "display_order" INTEGER;
ALTER TABLE "items" ADD COLUMN "sku" VARCHAR(100);
ALTER TABLE "items" ADD COLUMN "min_threshold" DECIMAL;
ALTER TABLE "items" ADD COLUMN "stock_managed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "items" ADD COLUMN "main_supplier_id" TEXT;

-- 9. Les anciennes lignes "matière" avaient déjà un stock suivi
UPDATE "items" SET "stock_managed" = true WHERE "type" = 'STOCK_PRODUCT';

-- 10. FK fournisseur principal (optionnelle)
ALTER TABLE "items" ADD CONSTRAINT "items_main_supplier_id_fkey"
  FOREIGN KEY ("main_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 11. Index sur le type, pour filtrer rapidement SERVICE vs STOCK_PRODUCT
CREATE INDEX "items_type_idx" ON "items"("type");
