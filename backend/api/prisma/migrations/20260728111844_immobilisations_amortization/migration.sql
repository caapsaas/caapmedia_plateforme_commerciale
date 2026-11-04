-- Phase 7 du module comptabilité : amortissements et cession d'immobilisations.
-- Voir Doc/module-comptabilite-plan-implementation.md §2.9

-- CreateEnum
CREATE TYPE "public"."FixedAssetStatus" AS ENUM ('ACTIVE', 'DISPOSED');

-- AlterTable
ALTER TABLE "public"."fixed_assets" ADD COLUMN     "cumulative_amortization" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "disposal_amount" DECIMAL(15,2),
ADD COLUMN     "disposal_date" TIMESTAMP(3),
ADD COLUMN     "last_amortization_year" INTEGER,
ADD COLUMN     "residual_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status" "public"."FixedAssetStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "fixed_assets_status_idx" ON "public"."fixed_assets"("status");
