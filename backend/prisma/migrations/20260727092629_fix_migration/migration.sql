/*
  Warnings:

  - The `user_id` column on the `auth_audit_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `commercial_params` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `updated_by_id` column on the `commercial_params` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `equipement_cost_config` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `updated_by_id` column on the `equipement_cost_config` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `item_packaging_units` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `item_stocks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `main_supplier_id` column on the `items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `base_unit_id` column on the `items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `product_id` column on the `order_item` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `order_id` column on the `order_item` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `order_item_production_steps` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `order_item_production_summary` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `product_id` column on the `product_image` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `product_spec_groups` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `product_specifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `group_id` column on the `product_specifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `production_workflow_steps` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `production_workflows` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `item_id` column on the `production_workflows` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `purchase_unit_id` column on the `purchase_order_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `spec_reference_lists` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `spec_reference_values` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `stock_movements` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `order_id` column on the `stock_movements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `purchase_order_id` column on the `stock_movements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_by_id` column on the `stock_movements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `units` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[qr_code_token]` on the table `attendance_records` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `id` on the `auth_audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `commercial_params` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `equipement_cost_config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `equipment_id` on the `equipement_cost_config` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `item_packaging_units` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `item_id` on the `item_packaging_units` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `unit_id` on the `item_packaging_units` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `item_stocks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `item_id` on the `item_stocks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `subsidiary_id` on the `item_stocks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `order_item_production_steps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `order_item_id` on the `order_item_production_steps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `equipment_id` on the `order_item_production_steps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `order_item_production_summary` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `order_item_id` on the `order_item_production_summary` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `product_spec_groups` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `product_id` on the `product_spec_groups` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `product_specifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `product_id` on the `product_specifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `production_workflow_steps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `workflow_id` on the `production_workflow_steps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `equipment_id` on the `production_workflow_steps` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `production_workflows` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `product_id` on the `proforma_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `purchase_order_id` on the `purchase_order_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `product_id` on the `purchase_order_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `refresh_tokens` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `refresh_tokens` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `spec_reference_lists` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `spec_reference_values` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `list_id` on the `spec_reference_values` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `stock_movements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `item_id` on the `stock_movements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `subsidiary_id` on the `stock_movements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `units` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."commercial_params" DROP CONSTRAINT "commercial_params_updated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."equipement_cost_config" DROP CONSTRAINT "equipement_cost_config_equipment_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."equipement_cost_config" DROP CONSTRAINT "equipement_cost_config_updated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."item_packaging_units" DROP CONSTRAINT "item_packaging_units_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."item_packaging_units" DROP CONSTRAINT "item_packaging_units_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."item_stocks" DROP CONSTRAINT "item_stocks_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."item_stocks" DROP CONSTRAINT "item_stocks_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."items" DROP CONSTRAINT "items_base_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."items" DROP CONSTRAINT "items_main_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_item" DROP CONSTRAINT "order_item_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_item" DROP CONSTRAINT "order_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_item_production_steps" DROP CONSTRAINT "order_item_production_steps_equipment_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_item_production_steps" DROP CONSTRAINT "order_item_production_steps_order_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_item_production_summary" DROP CONSTRAINT "order_item_production_summary_order_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_image" DROP CONSTRAINT "product_image_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_spec_groups" DROP CONSTRAINT "product_spec_groups_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_specifications" DROP CONSTRAINT "product_specifications_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_specifications" DROP CONSTRAINT "product_specifications_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."production_workflow_steps" DROP CONSTRAINT "production_workflow_steps_equipment_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."production_workflow_steps" DROP CONSTRAINT "production_workflow_steps_workflow_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."production_workflows" DROP CONSTRAINT "production_workflows_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."proforma_items" DROP CONSTRAINT "proforma_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_purchase_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."spec_reference_values" DROP CONSTRAINT "spec_reference_values_list_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_subsidiary_id_fkey";

-- DropIndex
DROP INDEX "public"."idx_attendance_records_geolocation";

-- AlterTable
ALTER TABLE "public"."attendance_records" ALTER COLUMN "qr_code_token" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."auth_audit_logs" DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID,
ADD CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."commercial_params" DROP CONSTRAINT "commercial_params_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "updated_by_id",
ADD COLUMN     "updated_by_id" UUID,
ADD CONSTRAINT "commercial_params_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."daily_qr_codes" ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "qr_url" TEXT;

-- AlterTable
ALTER TABLE "public"."equipement_cost_config" DROP CONSTRAINT "equipement_cost_config_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "equipment_id",
ADD COLUMN     "equipment_id" UUID NOT NULL,
DROP COLUMN "updated_by_id",
ADD COLUMN     "updated_by_id" UUID,
ADD CONSTRAINT "equipement_cost_config_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."item_packaging_units" DROP CONSTRAINT "item_packaging_units_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "item_id",
ADD COLUMN     "item_id" UUID NOT NULL,
DROP COLUMN "unit_id",
ADD COLUMN     "unit_id" UUID NOT NULL,
ADD CONSTRAINT "item_packaging_units_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."item_stocks" DROP CONSTRAINT "item_stocks_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "item_id",
ADD COLUMN     "item_id" UUID NOT NULL,
DROP COLUMN "subsidiary_id",
ADD COLUMN     "subsidiary_id" UUID NOT NULL,
ADD CONSTRAINT "item_stocks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."items" DROP CONSTRAINT "items_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "main_supplier_id",
ADD COLUMN     "main_supplier_id" UUID,
DROP COLUMN "base_unit_id",
ADD COLUMN     "base_unit_id" UUID,
ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."order_item" DROP COLUMN "product_id",
ADD COLUMN     "product_id" UUID,
DROP COLUMN "order_id",
ADD COLUMN     "order_id" UUID;

-- AlterTable
ALTER TABLE "public"."order_item_production_steps" DROP CONSTRAINT "order_item_production_steps_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "order_item_id",
ADD COLUMN     "order_item_id" UUID NOT NULL,
DROP COLUMN "equipment_id",
ADD COLUMN     "equipment_id" UUID NOT NULL,
ADD CONSTRAINT "order_item_production_steps_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."order_item_production_summary" DROP CONSTRAINT "order_item_production_summary_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "order_item_id",
ADD COLUMN     "order_item_id" UUID NOT NULL,
ADD CONSTRAINT "order_item_production_summary_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."product_image" DROP COLUMN "product_id",
ADD COLUMN     "product_id" UUID;

-- AlterTable
ALTER TABLE "public"."product_spec_groups" DROP CONSTRAINT "product_spec_groups_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "product_id",
ADD COLUMN     "product_id" UUID NOT NULL,
ADD CONSTRAINT "product_spec_groups_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."product_specifications" DROP CONSTRAINT "product_specifications_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "product_id",
ADD COLUMN     "product_id" UUID NOT NULL,
DROP COLUMN "group_id",
ADD COLUMN     "group_id" UUID,
ADD CONSTRAINT "product_specifications_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."production_workflow_steps" DROP CONSTRAINT "production_workflow_steps_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "workflow_id",
ADD COLUMN     "workflow_id" UUID NOT NULL,
DROP COLUMN "equipment_id",
ADD COLUMN     "equipment_id" UUID NOT NULL,
ADD CONSTRAINT "production_workflow_steps_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."production_workflows" DROP CONSTRAINT "production_workflows_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "item_id",
ADD COLUMN     "item_id" UUID,
ADD CONSTRAINT "production_workflows_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."proforma_items" DROP COLUMN "product_id",
ADD COLUMN     "product_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."purchase_order_items" DROP COLUMN "purchase_order_id",
ADD COLUMN     "purchase_order_id" UUID NOT NULL,
DROP COLUMN "product_id",
ADD COLUMN     "product_id" UUID NOT NULL,
DROP COLUMN "purchase_unit_id",
ADD COLUMN     "purchase_unit_id" UUID;

-- AlterTable
ALTER TABLE "public"."refresh_tokens" DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."spec_reference_lists" DROP CONSTRAINT "spec_reference_lists_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "spec_reference_lists_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."spec_reference_values" DROP CONSTRAINT "spec_reference_values_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "list_id",
ADD COLUMN     "list_id" UUID NOT NULL,
ADD CONSTRAINT "spec_reference_values_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."stock_movements" DROP CONSTRAINT "stock_movements_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "item_id",
ADD COLUMN     "item_id" UUID NOT NULL,
DROP COLUMN "subsidiary_id",
ADD COLUMN     "subsidiary_id" UUID NOT NULL,
DROP COLUMN "order_id",
ADD COLUMN     "order_id" UUID,
DROP COLUMN "purchase_order_id",
ADD COLUMN     "purchase_order_id" UUID,
DROP COLUMN "created_by_id",
ADD COLUMN     "created_by_id" UUID,
ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."units" DROP CONSTRAINT "units_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_qr_code_token_key" ON "public"."attendance_records"("qr_code_token");

-- CreateIndex
CREATE INDEX "attendance_records_qr_code_token_idx" ON "public"."attendance_records"("qr_code_token");

-- CreateIndex
CREATE INDEX "auth_audit_logs_user_id_idx" ON "public"."auth_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "daily_qr_codes_employee_id_is_active_idx" ON "public"."daily_qr_codes"("employee_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "equipement_cost_config_equipment_id_key" ON "public"."equipement_cost_config"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_packaging_units_item_id_unit_id_key" ON "public"."item_packaging_units"("item_id", "unit_id");

-- CreateIndex
CREATE INDEX "item_stocks_subsidiary_id_idx" ON "public"."item_stocks"("subsidiary_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_stocks_item_id_subsidiary_id_key" ON "public"."item_stocks"("item_id", "subsidiary_id");

-- CreateIndex
CREATE INDEX "order_item_product_id_idx" ON "public"."order_item"("product_id");

-- CreateIndex
CREATE INDEX "order_item_order_id_idx" ON "public"."order_item"("order_id");

-- CreateIndex
CREATE INDEX "order_item_production_steps_order_item_id_idx" ON "public"."order_item_production_steps"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_production_summary_order_item_id_key" ON "public"."order_item_production_summary"("order_item_id");

-- CreateIndex
CREATE INDEX "product_spec_groups_product_id_idx" ON "public"."product_spec_groups"("product_id");

-- CreateIndex
CREATE INDEX "product_specifications_product_id_idx" ON "public"."product_specifications"("product_id");

-- CreateIndex
CREATE INDEX "product_specifications_group_id_idx" ON "public"."product_specifications"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_specifications_product_id_technical_key_key" ON "public"."product_specifications"("product_id", "technical_key");

-- CreateIndex
CREATE INDEX "production_workflow_steps_workflow_id_idx" ON "public"."production_workflow_steps"("workflow_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_workflow_steps_workflow_id_step_order_key" ON "public"."production_workflow_steps"("workflow_id", "step_order");

-- CreateIndex
CREATE UNIQUE INDEX "production_workflows_item_id_key" ON "public"."production_workflows"("item_id");

-- CreateIndex
CREATE INDEX "proforma_items_product_id_idx" ON "public"."proforma_items"("product_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_product_id_idx" ON "public"."purchase_order_items"("product_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "public"."refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "spec_reference_values_list_id_idx" ON "public"."spec_reference_values"("list_id");

-- CreateIndex
CREATE INDEX "stock_movements_item_id_subsidiary_id_idx" ON "public"."stock_movements"("item_id", "subsidiary_id");

-- CreateIndex
CREATE INDEX "stock_movements_subsidiary_id_created_at_idx" ON "public"."stock_movements"("subsidiary_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_order_id_idx" ON "public"."stock_movements"("order_id");

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_main_supplier_id_fkey" FOREIGN KEY ("main_supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_base_unit_id_fkey" FOREIGN KEY ("base_unit_id") REFERENCES "public"."units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_packaging_units" ADD CONSTRAINT "item_packaging_units_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_packaging_units" ADD CONSTRAINT "item_packaging_units_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_stocks" ADD CONSTRAINT "item_stocks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_stocks" ADD CONSTRAINT "item_stocks_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_image" ADD CONSTRAINT "product_image_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_spec_groups" ADD CONSTRAINT "product_spec_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_specifications" ADD CONSTRAINT "product_specifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_specifications" ADD CONSTRAINT "product_specifications_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."product_spec_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spec_reference_values" ADD CONSTRAINT "spec_reference_values_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."spec_reference_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_unit_id_fkey" FOREIGN KEY ("purchase_unit_id") REFERENCES "public"."units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipement_cost_config" ADD CONSTRAINT "equipement_cost_config_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipement_cost_config" ADD CONSTRAINT "equipement_cost_config_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_workflows" ADD CONSTRAINT "production_workflows_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_workflow_steps" ADD CONSTRAINT "production_workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."production_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_workflow_steps" ADD CONSTRAINT "production_workflow_steps_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."commercial_params" ADD CONSTRAINT "commercial_params_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_production_steps" ADD CONSTRAINT "order_item_production_steps_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_production_steps" ADD CONSTRAINT "order_item_production_steps_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item_production_summary" ADD CONSTRAINT "order_item_production_summary_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proforma_items" ADD CONSTRAINT "proforma_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_qr_codes" ADD CONSTRAINT "daily_qr_codes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."idx_attendance_records_employee_date" RENAME TO "attendance_records_employee_id_attendance_date_idx";

-- RenameIndex
ALTER INDEX "public"."idx_daily_qr_codes_expires_at" RENAME TO "daily_qr_codes_expires_at_idx";

-- RenameIndex
ALTER INDEX "public"."idx_daily_qr_codes_subsidiary_active" RENAME TO "daily_qr_codes_subsidiary_id_is_active_idx";

-- RenameIndex
ALTER INDEX "public"."idx_subsidiaries_geolocation" RENAME TO "subsidiaries_latitude_longitude_idx";
