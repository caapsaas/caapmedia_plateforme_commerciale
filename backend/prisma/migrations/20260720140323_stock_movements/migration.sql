-- Chantier 3 : journal des mouvements de stock. Toute variation de stock
-- (achat, retour, casse, perte, consommation production, ajustement
-- d'inventaire, transfert) passe désormais par une ligne ici, en unité de
-- base, jamais calculée automatiquement à partir d'une commande.

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM (
    'PURCHASE_RECEIPT',
    'CUSTOMER_RETURN',
    'POSITIVE_ADJUSTMENT',
    'TRANSFER_IN',
    'PRODUCTION_CONSUMPTION',
    'LOSS',
    'BREAKAGE',
    'INTERNAL_CONSUMPTION',
    'NEGATIVE_ADJUSTMENT',
    'SUPPLIER_RETURN',
    'TRANSFER_OUT'
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "subsidiary_id" UUID NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "reason" TEXT,
    "order_id" UUID,
    "purchase_order_id" UUID,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_movements_item_id_subsidiary_id_idx" ON "stock_movements"("item_id", "subsidiary_id");
CREATE INDEX "stock_movements_subsidiary_id_created_at_idx" ON "stock_movements"("subsidiary_id", "created_at");
CREATE INDEX "stock_movements_order_id_idx" ON "stock_movements"("order_id");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
