-- Chantier 5 : moteur de spécifications configurables (Builder de formulaires)

CREATE TYPE "SpecFieldType" AS ENUM (
  'TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'AMOUNT', 'SELECT', 'MULTISELECT',
  'RADIO', 'CHECKBOX', 'BOOLEAN', 'DATE', 'TIME', 'COLOR', 'UPLOAD', 'URL',
  'EMAIL', 'PHONE', 'DIMENSIONS'
);

CREATE TABLE "product_spec_groups" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT "product_spec_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_specifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "product_id" UUID NOT NULL,
  "group_id" UUID,
  "name" VARCHAR(150) NOT NULL,
  "technical_key" VARCHAR(100) NOT NULL,
  "type" "SpecFieldType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "default_value" JSONB,
  "possible_values" JSONB,
  "order" INTEGER NOT NULL,
  "help_text" TEXT,
  "placeholder" TEXT,
  "unit" VARCHAR(50),
  "visible_to_client" BOOLEAN NOT NULL DEFAULT true,
  "visible_to_production" BOOLEAN NOT NULL DEFAULT true,
  "editable_after_validation" BOOLEAN NOT NULL DEFAULT false,
  "searchable" BOOLEAN NOT NULL DEFAULT false,
  "internal_description" TEXT,
  "type_config" JSONB,
  "rules" JSONB,
  CONSTRAINT "product_specifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spec_reference_lists" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" VARCHAR(100) NOT NULL,
  "name" VARCHAR(150) NOT NULL,
  CONSTRAINT "spec_reference_lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spec_reference_values" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "list_id" UUID NOT NULL,
  "value" VARCHAR(150) NOT NULL,
  "label" VARCHAR(150) NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT "spec_reference_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "spec_reference_lists_key_key" ON "spec_reference_lists"("key");
CREATE INDEX "spec_reference_values_list_id_idx" ON "spec_reference_values"("list_id");
CREATE INDEX "product_spec_groups_product_id_idx" ON "product_spec_groups"("product_id");
CREATE INDEX "product_specifications_product_id_idx" ON "product_specifications"("product_id");
CREATE INDEX "product_specifications_group_id_idx" ON "product_specifications"("group_id");
CREATE UNIQUE INDEX "product_specifications_product_id_technical_key_key" ON "product_specifications"("product_id", "technical_key");

ALTER TABLE "product_spec_groups" ADD CONSTRAINT "product_spec_groups_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "product_spec_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "spec_reference_values" ADD CONSTRAINT "spec_reference_values_list_id_fkey"
  FOREIGN KEY ("list_id") REFERENCES "spec_reference_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Instantané figé par ligne de commande (jamais affecté par une évolution ultérieure du produit)
ALTER TABLE "order_item" ADD COLUMN "spec_values" JSONB;
ALTER TABLE "order_item" ADD COLUMN "spec_snapshot" JSONB;
