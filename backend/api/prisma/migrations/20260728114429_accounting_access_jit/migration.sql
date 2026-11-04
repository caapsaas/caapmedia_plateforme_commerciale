-- Phase 8 du module comptabilité : accès temporaire (JIT) à la comptabilité.
-- Voir Doc/module-comptabilite-plan-implementation.md §2.10

-- CreateEnum
CREATE TYPE "public"."AccountingAccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNTING_ACCESS_REQUESTED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNTING_ACCESS_APPROVED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'ACCOUNTING_ACCESS_REJECTED';

-- CreateTable
CREATE TABLE "public"."accounting_access_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "status" "public"."AccountingAccessStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_note" TEXT,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "accounting_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounting_access_requests_user_id_status_idx" ON "public"."accounting_access_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "accounting_access_requests_status_idx" ON "public"."accounting_access_requests"("status");

-- CreateIndex
CREATE INDEX "accounting_access_requests_expires_at_idx" ON "public"."accounting_access_requests"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."accounting_access_requests" ADD CONSTRAINT "accounting_access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_access_requests" ADD CONSTRAINT "accounting_access_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
