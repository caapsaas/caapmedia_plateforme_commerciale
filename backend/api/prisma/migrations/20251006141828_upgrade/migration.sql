-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "group_id" UUID;

-- CreateTable
CREATE TABLE "public"."order_group" (
    "id" UUID NOT NULL,
    "group_code" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_group_group_code_key" ON "public"."order_group"("group_code");

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."order_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
