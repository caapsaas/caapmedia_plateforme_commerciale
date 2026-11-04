/*
  Warnings:

  - You are about to drop the column `upload_date` on the `company_documents` table. All the data in the column will be lost.
  - The primary key for the `meeting_participants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `meeting_participants` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_date` on the `meetings` table. All the data in the column will be lost.
  - You are about to drop the column `meeting_time` on the `meetings` table. All the data in the column will be lost.
  - Added the required column `meeting_date_time` to the `meetings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `meetings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `secretariat_tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."company_documents_subsidiary_id_upload_date_idx";

-- DropIndex
DROP INDEX "public"."meeting_participants_meeting_id_employee_id_key";

-- DropIndex
DROP INDEX "public"."meetings_subsidiary_id_meeting_date_idx";

-- AlterTable
ALTER TABLE "public"."company_documents" DROP COLUMN "upload_date",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."meeting_participants" DROP CONSTRAINT "meeting_participants_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("meeting_id", "employee_id");

-- AlterTable
ALTER TABLE "public"."meetings" DROP COLUMN "meeting_date",
DROP COLUMN "meeting_time",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "meeting_date_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "minutes_updated_at" TIMESTAMP(3),
ADD COLUMN     "minutes_updated_by" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."secretariat_tasks" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "company_documents_subsidiary_id_created_at_idx" ON "public"."company_documents"("subsidiary_id", "created_at");

-- CreateIndex
CREATE INDEX "meetings_subsidiary_id_meeting_date_time_idx" ON "public"."meetings"("subsidiary_id", "meeting_date_time");

-- AddForeignKey
ALTER TABLE "public"."company_documents" ADD CONSTRAINT "company_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meetings" ADD CONSTRAINT "meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secretariat_tasks" ADD CONSTRAINT "secretariat_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
