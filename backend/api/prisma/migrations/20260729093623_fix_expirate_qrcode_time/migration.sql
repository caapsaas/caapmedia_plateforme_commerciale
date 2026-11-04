/*
  Warnings:

  - Made the column `employee_id` on table `daily_qr_codes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."daily_qr_codes" ALTER COLUMN "expires_at" DROP NOT NULL,
ALTER COLUMN "employee_id" SET NOT NULL;
