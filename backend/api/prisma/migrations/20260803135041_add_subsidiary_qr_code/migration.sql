-- CreateTable
CREATE TABLE "public"."subsidiary_qr_codes" (
    "id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subsidiary_qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subsidiary_qr_codes_subsidiary_id_key" ON "public"."subsidiary_qr_codes"("subsidiary_id");

-- CreateIndex
CREATE UNIQUE INDEX "subsidiary_qr_codes_token_key" ON "public"."subsidiary_qr_codes"("token");

-- CreateIndex
CREATE INDEX "subsidiary_qr_codes_subsidiary_id_is_active_idx" ON "public"."subsidiary_qr_codes"("subsidiary_id", "is_active");

-- AddForeignKey
ALTER TABLE "public"."subsidiary_qr_codes" ADD CONSTRAINT "subsidiary_qr_codes_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
