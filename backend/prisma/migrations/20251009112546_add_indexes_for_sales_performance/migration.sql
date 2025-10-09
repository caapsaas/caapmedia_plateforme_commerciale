-- CreateIndex
CREATE INDEX "sale_subsidiary_id_sale_date_idx" ON "public"."sale"("subsidiary_id", "sale_date" DESC);

-- CreateIndex
CREATE INDEX "sale_subsidiary_id_customer_id_idx" ON "public"."sale"("subsidiary_id", "customer_id");

-- CreateIndex
CREATE INDEX "sale_subsidiary_id_sales_rep_id_idx" ON "public"."sale"("subsidiary_id", "sales_rep_id");

-- CreateIndex
CREATE INDEX "tax_rates_is_default_idx" ON "public"."tax_rates"("is_default");
