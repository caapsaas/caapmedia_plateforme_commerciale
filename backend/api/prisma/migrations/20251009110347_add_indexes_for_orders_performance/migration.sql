-- CreateIndex
CREATE INDEX "order_group_customer_id_idx" ON "public"."order_group"("customer_id");

-- CreateIndex
CREATE INDEX "order_item_product_id_idx" ON "public"."order_item"("product_id");

-- CreateIndex
CREATE INDEX "order_item_order_id_idx" ON "public"."order_item"("order_id");

-- CreateIndex
CREATE INDEX "orders_subsidiary_id_customer_id_order_date_idx" ON "public"."orders"("subsidiary_id", "customer_id", "order_date" DESC);

-- CreateIndex
CREATE INDEX "orders_subsidiary_id_status_idx" ON "public"."orders"("subsidiary_id", "status");

-- CreateIndex
CREATE INDEX "orders_subsidiary_id_payment_status_idx" ON "public"."orders"("subsidiary_id", "payment_status");
