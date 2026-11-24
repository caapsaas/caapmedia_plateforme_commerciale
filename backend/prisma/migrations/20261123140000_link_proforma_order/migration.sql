ALTER TABLE "proformas" ADD COLUMN "order_id" TEXT;

CREATE UNIQUE INDEX "proformas_order_id_key" ON "proformas"("order_id");

ALTER TABLE "proformas" ADD CONSTRAINT "proformas_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
