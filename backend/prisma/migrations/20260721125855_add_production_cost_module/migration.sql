-- AlterTable
ALTER TABLE "public"."item_packaging_units" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."item_stocks" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."stock_movements" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."units" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."equipement_cost_config" (
    "id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "hourly_rate" DECIMAL(15,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" UUID,

    CONSTRAINT "equipement_cost_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."production_workflows" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "item_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."production_workflow_steps" (
    "id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,

    CONSTRAINT "production_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commercial_params" (
    "id" UUID NOT NULL,
    "min_margin_percent" DECIMAL(5,2) NOT NULL,
    "max_margin_percent" DECIMAL(5,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" UUID,

    CONSTRAINT "commercial_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_item_production_steps" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "equipment_name_snapshot" VARCHAR(255) NOT NULL,
    "step_order" INTEGER NOT NULL,
    "estimated_time_hours" DECIMAL(5,2) NOT NULL,
    "hourly_rate_snapshot" DECIMAL(15,2) NOT NULL,
    "calculated_cost" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "order_item_production_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_item_production_summary" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "total_production_cost" DECIMAL(15,2) NOT NULL,
    "margin_percent" DECIMAL(5,2) NOT NULL,
    "final_price" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "order_item_production_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipement_cost_config_equipment_id_key" ON "public"."equipement_cost_config"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_workflows_item_id_key" ON "public"."production_workflows"("item_id");

-- CreateIndex
CREATE INDEX "production_workflow_steps_workflow_id_idx" ON "public"."production_workflow_steps"("workflow_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_workflow_steps_workflow_id_step_order_key" ON "public"."production_workflow_steps"("workflow_id", "step_order");

-- CreateIndex
CREATE INDEX "order_item_production_steps_order_item_id_idx" ON "public"."order_item_production_steps"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_production_summary_order_item_id_key" ON "public"."order_item_production_summary"("order_item_id");

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
