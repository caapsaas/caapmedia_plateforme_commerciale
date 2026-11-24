/*
  Warnings:

  - A unique constraint covering the columns `[pin_code]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "pin_code" VARCHAR(6);

-- CreateTable
CREATE TABLE "public"."dynamic_tokens" (
    "id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "dynamic_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_tokens_token_key" ON "public"."dynamic_tokens"("token");

-- CreateIndex
CREATE INDEX "dynamic_tokens_subsidiary_id_is_used_idx" ON "public"."dynamic_tokens"("subsidiary_id", "is_used");

-- CreateIndex
CREATE INDEX "dynamic_tokens_expires_at_idx" ON "public"."dynamic_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_pin_code_key" ON "public"."employees"("pin_code");

-- AddForeignKey
ALTER TABLE "public"."dynamic_tokens" ADD CONSTRAINT "dynamic_tokens_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
