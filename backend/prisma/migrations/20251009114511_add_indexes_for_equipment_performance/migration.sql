-- CreateIndex
CREATE INDEX "equipment_subsidiary_id_idx" ON "public"."equipment"("subsidiary_id");

-- CreateIndex
CREATE INDEX "equipment_subsidiary_id_status_idx" ON "public"."equipment"("subsidiary_id", "status");

-- CreateIndex
CREATE INDEX "equipment_subsidiary_id_next_maintenance_date_idx" ON "public"."equipment"("subsidiary_id", "next_maintenance_date");

-- CreateIndex
CREATE INDEX "equipment_subsidiary_id_acquisition_date_idx" ON "public"."equipment"("subsidiary_id", "acquisition_date");
