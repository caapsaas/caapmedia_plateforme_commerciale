-- CreateEnum
CREATE TYPE "public"."ProformaStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateTable
CREATE TABLE "public"."proformas" (
    "id" UUID NOT NULL,
    "proforma_number" VARCHAR(50) NOT NULL,
    "lead_id" UUID NOT NULL,
    "opportunity_id" UUID,
    "client_name" VARCHAR(255) NOT NULL,
    "client_email" VARCHAR(255) NOT NULL,
    "client_phone" VARCHAR(255) NOT NULL,
    "client_company" VARCHAR(255),
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "public"."ProformaStatus" NOT NULL DEFAULT 'DRAFT',
    "validity_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "subsidiary_id" UUID NOT NULL,

    CONSTRAINT "proformas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."proforma_items" (
    "id" UUID NOT NULL,
    "proforma_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "description" VARCHAR(500),

    CONSTRAINT "proforma_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proformas_proforma_number_key" ON "public"."proformas"("proforma_number");

-- CreateIndex
CREATE INDEX "proformas_lead_id_idx" ON "public"."proformas"("lead_id");

-- CreateIndex
CREATE INDEX "proformas_opportunity_id_idx" ON "public"."proformas"("opportunity_id");

-- CreateIndex
CREATE INDEX "proformas_created_by_idx" ON "public"."proformas"("created_by");

-- CreateIndex
CREATE INDEX "proformas_status_idx" ON "public"."proformas"("status");

-- CreateIndex
CREATE INDEX "proformas_subsidiary_id_idx" ON "public"."proformas"("subsidiary_id");

-- CreateIndex
CREATE INDEX "proforma_items_proforma_id_idx" ON "public"."proforma_items"("proforma_id");

-- CreateIndex
CREATE INDEX "proforma_items_product_id_idx" ON "public"."proforma_items"("product_id");

-- AddForeignKey
ALTER TABLE "public"."proformas" ADD CONSTRAINT "proformas_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proformas" ADD CONSTRAINT "proformas_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proformas" ADD CONSTRAINT "proformas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proformas" ADD CONSTRAINT "proformas_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proforma_items" ADD CONSTRAINT "proforma_items_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "public"."proformas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proforma_items" ADD CONSTRAINT "proforma_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
