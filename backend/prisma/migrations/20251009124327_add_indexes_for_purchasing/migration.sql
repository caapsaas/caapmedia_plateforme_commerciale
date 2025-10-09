-- CreateIndex
CREATE INDEX "purchase_orders_subsidiary_id_order_date_idx" ON "public"."purchase_orders"("subsidiary_id", "order_date" DESC);

-- CreateIndex
CREATE INDEX "purchase_orders_subsidiary_id_supplier_id_idx" ON "public"."purchase_orders"("subsidiary_id", "supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_subsidiary_id_status_idx" ON "public"."purchase_orders"("subsidiary_id", "status");

-- CreateIndex
CREATE INDEX "purchase_orders_subsidiary_id_payment_status_idx" ON "public"."purchase_orders"("subsidiary_id", "payment_status");

-- CreateIndex
CREATE INDEX "supplier_debts_purchase_order_id_idx" ON "public"."supplier_debts"("purchase_order_id");
