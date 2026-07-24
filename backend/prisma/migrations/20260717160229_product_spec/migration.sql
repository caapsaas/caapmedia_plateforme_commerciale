/*
  Warnings:

  - You are about to alter the column `min_threshold` on the `items` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- DropForeignKey
ALTER TABLE "public"."items" DROP CONSTRAINT "items_subsidiary_id_fkey";

-- AlterTable
ALTER TABLE "public"."items" ALTER COLUMN "min_threshold" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "public"."product_spec_groups" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."product_specifications" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."spec_reference_lists" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."spec_reference_values" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
