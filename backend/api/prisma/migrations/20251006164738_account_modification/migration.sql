-- DropForeignKey
ALTER TABLE "public"."contacts" DROP CONSTRAINT "contacts_subsidiary_id_fkey";

-- AlterTable
ALTER TABLE "public"."contacts" ALTER COLUMN "subsidiary_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."crm_tasks" ALTER COLUMN "description" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
