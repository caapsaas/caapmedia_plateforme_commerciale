-- CreateEnum
CREATE TYPE "public"."JournalType" AS ENUM ('VENTES', 'ACHATS', 'TRESORERIE', 'OD');

-- AlterTable
ALTER TABLE "public"."journal_entries" ADD COLUMN     "journal_id" UUID,
ADD COLUMN     "source_id" VARCHAR(100),
ADD COLUMN     "source_type" VARCHAR(100);

-- CreateTable
CREATE TABLE "public"."accounting_journals" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "journal_type" "public"."JournalType" NOT NULL,
    "subsidiary_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "accounting_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account_mappings" (
    "id" UUID NOT NULL,
    "operation_type" VARCHAR(100) NOT NULL,
    "journal_code" VARCHAR(10) NOT NULL,
    "debit_account_num" VARCHAR(10) NOT NULL,
    "credit_account_num" VARCHAR(10) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "subsidiary_id" UUID NOT NULL,

    CONSTRAINT "account_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounting_journals_subsidiary_id_code_key" ON "public"."accounting_journals"("subsidiary_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "account_mappings_subsidiary_id_operation_type_key" ON "public"."account_mappings"("subsidiary_id", "operation_type");

-- CreateIndex
CREATE INDEX "journal_entries_journal_id_idx" ON "public"."journal_entries"("journal_id");

-- CreateIndex
CREATE INDEX "journal_entries_source_type_source_id_idx" ON "public"."journal_entries"("source_type", "source_id");

-- AddForeignKey
ALTER TABLE "public"."accounting_journals" ADD CONSTRAINT "accounting_journals_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_mappings" ADD CONSTRAINT "account_mappings_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "public"."accounting_journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
