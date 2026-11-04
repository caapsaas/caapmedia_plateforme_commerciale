-- Remove orphaned columns that are not in the Prisma schema
ALTER TABLE IF EXISTS "public"."products" DROP COLUMN IF EXISTS "price";
ALTER TABLE IF EXISTS "public"."products" DROP COLUMN IF EXISTS "selling_price";
