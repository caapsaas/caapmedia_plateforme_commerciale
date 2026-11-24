-- Chantier 4 (fin) : conserve historiquement la remise et le total par ligne
-- de commande, jamais recalculés après coup.
ALTER TABLE "order_item" ADD COLUMN "discount" DECIMAL(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE "order_item" ADD COLUMN "total" DECIMAL(15, 2);

-- Backfill des lignes existantes : total = unit_price * quantity (discount = 0 par défaut)
UPDATE "order_item" SET "total" = "unit_price" * "quantity" WHERE "total" IS NULL;

ALTER TABLE "order_item" ALTER COLUMN "total" SET NOT NULL;
