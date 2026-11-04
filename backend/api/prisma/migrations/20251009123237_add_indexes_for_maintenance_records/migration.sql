-- CreateIndex
CREATE INDEX "maintenance_records_equipment_id_idx" ON "public"."maintenance_records"("equipment_id");

-- CreateIndex
CREATE INDEX "maintenance_records_equipment_id_maintenance_date_idx" ON "public"."maintenance_records"("equipment_id", "maintenance_date");
