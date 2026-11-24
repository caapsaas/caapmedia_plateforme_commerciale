/*
  Warnings:

  - You are about to drop the column `pin_code` on the `employees` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."employees_pin_code_key";

-- AlterTable
ALTER TABLE "public"."employees" DROP COLUMN "pin_code";
