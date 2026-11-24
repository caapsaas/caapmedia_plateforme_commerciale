CREATE TABLE "cash_remittance_orders" (
    "cash_remittance_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,

    CONSTRAINT "cash_remittance_orders_pkey" PRIMARY KEY ("cash_remittance_id", "order_id")
);

CREATE UNIQUE INDEX "cash_remittance_orders_order_id_key" ON "cash_remittance_orders"("order_id");

CREATE INDEX "cash_remittance_orders_cash_remittance_id_idx" ON "cash_remittance_orders"("cash_remittance_id");

ALTER TABLE "cash_remittance_orders"
ADD CONSTRAINT "cash_remittance_orders_cash_remittance_id_fkey"
FOREIGN KEY ("cash_remittance_id") REFERENCES "cash_remittances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cash_remittance_orders"
ADD CONSTRAINT "cash_remittance_orders_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
