-- Plan de migration ID prefixes, Phase 1 (voir Doc/migration-id-prefixes-plan.md).
-- Retire le typage uuid restant sur 44 colonnes reparties sur 19 tables.
-- No-op physique: information_schema.columns confirme 0 colonne reellement
-- de type uuid dans cette base (deja convertie en TEXT par la migration
-- 20260717100439_complete_uuid_to_text_fixed). Ces ALTER ne font que faire
-- converger l'historique de migrations avec schema.prisma et la realite.

ALTER TABLE "public"."refresh_tokens" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."refresh_tokens" ALTER COLUMN "user_id" TYPE TEXT;

ALTER TABLE "public"."auth_audit_logs" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."auth_audit_logs" ALTER COLUMN "user_id" TYPE TEXT;

ALTER TABLE "public"."items" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."items" ALTER COLUMN "main_supplier_id" TYPE TEXT;
ALTER TABLE "public"."items" ALTER COLUMN "base_unit_id" TYPE TEXT;

ALTER TABLE "public"."units" ALTER COLUMN "id" TYPE TEXT;

ALTER TABLE "public"."item_packaging_units" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."item_packaging_units" ALTER COLUMN "item_id" TYPE TEXT;
ALTER TABLE "public"."item_packaging_units" ALTER COLUMN "unit_id" TYPE TEXT;

ALTER TABLE "public"."item_stocks" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."item_stocks" ALTER COLUMN "item_id" TYPE TEXT;
ALTER TABLE "public"."item_stocks" ALTER COLUMN "subsidiary_id" TYPE TEXT;

ALTER TABLE "public"."stock_movements" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."stock_movements" ALTER COLUMN "item_id" TYPE TEXT;
ALTER TABLE "public"."stock_movements" ALTER COLUMN "subsidiary_id" TYPE TEXT;
ALTER TABLE "public"."stock_movements" ALTER COLUMN "order_id" TYPE TEXT;
ALTER TABLE "public"."stock_movements" ALTER COLUMN "purchase_order_id" TYPE TEXT;

ALTER TABLE "public"."product_image" ALTER COLUMN "product_id" TYPE TEXT;

ALTER TABLE "public"."product_spec_groups" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."product_spec_groups" ALTER COLUMN "product_id" TYPE TEXT;

ALTER TABLE "public"."product_specifications" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."product_specifications" ALTER COLUMN "product_id" TYPE TEXT;
ALTER TABLE "public"."product_specifications" ALTER COLUMN "group_id" TYPE TEXT;

ALTER TABLE "public"."spec_reference_lists" ALTER COLUMN "id" TYPE TEXT;

ALTER TABLE "public"."spec_reference_values" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."spec_reference_values" ALTER COLUMN "list_id" TYPE TEXT;

ALTER TABLE "public"."order_item" ALTER COLUMN "product_id" TYPE TEXT;
ALTER TABLE "public"."order_item" ALTER COLUMN "order_id" TYPE TEXT;

ALTER TABLE "public"."purchase_order_items" ALTER COLUMN "purchase_order_id" TYPE TEXT;
ALTER TABLE "public"."purchase_order_items" ALTER COLUMN "product_id" TYPE TEXT;
ALTER TABLE "public"."purchase_order_items" ALTER COLUMN "purchase_unit_id" TYPE TEXT;

ALTER TABLE "public"."production_workflows" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."production_workflows" ALTER COLUMN "item_id" TYPE TEXT;

ALTER TABLE "public"."production_workflow_steps" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."production_workflow_steps" ALTER COLUMN "workflow_id" TYPE TEXT;
ALTER TABLE "public"."production_workflow_steps" ALTER COLUMN "equipment_id" TYPE TEXT;

ALTER TABLE "public"."order_item_production_steps" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."order_item_production_steps" ALTER COLUMN "order_item_id" TYPE TEXT;
ALTER TABLE "public"."order_item_production_steps" ALTER COLUMN "equipment_id" TYPE TEXT;

ALTER TABLE "public"."order_item_production_summary" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."order_item_production_summary" ALTER COLUMN "order_item_id" TYPE TEXT;

ALTER TABLE "public"."proforma_items" ALTER COLUMN "product_id" TYPE TEXT;
