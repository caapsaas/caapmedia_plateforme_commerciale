/*
  Warnings:

  - The values [CASH,CHECK] on the enum `customer_payment_method` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."customer_payment_method_new" AS ENUM ('CARD', 'ORANGE_MONEY', 'WAVE', 'MOBILE_MONEY', 'PAYCAAP', 'PAY_ON_DELIVERY', 'CUSTOMER_CREDIT');
ALTER TABLE "public"."sale" ALTER COLUMN "payment_method" TYPE "public"."customer_payment_method_new" USING ("payment_method"::text::"public"."customer_payment_method_new");
ALTER TABLE "public"."orders" ALTER COLUMN "payment_method" TYPE "public"."customer_payment_method_new" USING ("payment_method"::text::"public"."customer_payment_method_new");
ALTER TYPE "public"."customer_payment_method" RENAME TO "customer_payment_method_old";
ALTER TYPE "public"."customer_payment_method_new" RENAME TO "customer_payment_method";
DROP TYPE "public"."customer_payment_method_old";
COMMIT;
