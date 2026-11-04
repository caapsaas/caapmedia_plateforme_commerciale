-- Restore the optional assembly fee used by orders and direct sales.
-- Existing totals remain unchanged; historical assembly fees are unknown.
ALTER TABLE "public"."order_item"
ADD COLUMN "assembly_price" DECIMAL(15,2);
