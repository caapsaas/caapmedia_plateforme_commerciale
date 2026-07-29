-- DropIndex
DROP INDEX "public"."idx_attendance_records_geolocation";

-- AlterTable
ALTER TABLE "public"."attendance_records" ALTER COLUMN "qr_code_token" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."daily_qr_codes" ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "qr_url" TEXT;

-- AlterTable
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "attendance_records_qr_code_token_idx" ON "public"."attendance_records"("qr_code_token");

-- CreateIndex
CREATE INDEX "daily_qr_codes_employee_id_is_active_idx" ON "public"."daily_qr_codes"("employee_id", "is_active");

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_qr_codes" ADD CONSTRAINT "daily_qr_codes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."idx_attendance_records_employee_date" RENAME TO "attendance_records_employee_id_attendance_date_idx";

-- RenameIndex
ALTER INDEX "public"."idx_daily_qr_codes_expires_at" RENAME TO "daily_qr_codes_expires_at_idx";

-- RenameIndex
ALTER INDEX "public"."idx_daily_qr_codes_subsidiary_active" RENAME TO "daily_qr_codes_subsidiary_id_is_active_idx";

-- RenameIndex
ALTER INDEX "public"."idx_subsidiaries_geolocation" RENAME TO "subsidiaries_latitude_longitude_idx";
