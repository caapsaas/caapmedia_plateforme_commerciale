-- Refonte du module comptabilité : plan comptable GLOBAL (retrait de subsidiary_id
-- sur AccountingAccount/AccountingJournal/AccountMapping), séquence de numérotation
-- légale par journal/filiale/exercice, extourne (reversal) au lieu de cancel destructif,
-- pattern Outbox pour la génération asynchrone d'écritures.
-- Voir Doc/module-comptabilite-plan-implementation.md

-- CreateEnum
CREATE TYPE "public"."AccountingOutboxStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."JournalType_new" AS ENUM ('VENTES', 'ACHATS', 'BANQUE', 'CAISSE', 'OD');
ALTER TABLE "public"."accounting_journals" ALTER COLUMN "journal_type" TYPE "public"."JournalType_new" USING ("journal_type"::text::"public"."JournalType_new");
ALTER TYPE "public"."JournalType" RENAME TO "JournalType_old";
ALTER TYPE "public"."JournalType_new" RENAME TO "JournalType";
DROP TYPE "public"."JournalType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."account_mappings" DROP CONSTRAINT "account_mappings_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounting_accounts" DROP CONSTRAINT "accounting_accounts_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounting_journals" DROP CONSTRAINT "accounting_journals_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_fiscal_year_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_journal_id_fkey";

-- DropIndex
DROP INDEX "public"."account_mappings_subsidiary_id_operation_type_key";

-- DropIndex
DROP INDEX "public"."accounting_accounts_subsidiary_id_account_number_idx";

-- DropIndex
DROP INDEX "public"."accounting_journals_subsidiary_id_code_key";

-- DropIndex
DROP INDEX "public"."journal_entries_status_idx";

-- AlterTable
ALTER TABLE "public"."account_mappings" DROP COLUMN "credit_account_num",
DROP COLUMN "debit_account_num",
DROP COLUMN "description",
DROP COLUMN "journal_code",
DROP COLUMN "operation_type",
DROP COLUMN "subsidiary_id",
ADD COLUMN     "account_code" VARCHAR(10) NOT NULL,
ADD COLUMN     "key" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "public"."accounting_accounts" DROP COLUMN "subsidiary_id",
ADD COLUMN     "class" INTEGER;

-- AlterTable
ALTER TABLE "public"."accounting_journals" DROP COLUMN "subsidiary_id";

-- AlterTable
ALTER TABLE "public"."journal_entries" DROP COLUMN "total_amount",
ADD COLUMN     "reversal_of_entry_id" TEXT,
ADD COLUMN     "sequential_number" TEXT,
ALTER COLUMN "entry_number" SET DATA TYPE VARCHAR(80),
ALTER COLUMN "fiscal_year_id" DROP NOT NULL,
ALTER COLUMN "created_by" DROP NOT NULL,
ALTER COLUMN "journal_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."journal_entry_lines" DROP COLUMN "balance";

-- CreateTable
CREATE TABLE "public"."accounting_journal_sequences" (
    "id" TEXT NOT NULL,
    "journal_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "accounting_journal_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounting_outbox_entries" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "public"."AccountingOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "subsidiary_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "accounting_outbox_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounting_journal_sequences_journal_id_subsidiary_id_year_key" ON "public"."accounting_journal_sequences"("journal_id", "subsidiary_id", "year");

-- CreateIndex
CREATE INDEX "accounting_outbox_entries_status_created_at_idx" ON "public"."accounting_outbox_entries"("status", "created_at");

-- CreateIndex
CREATE INDEX "accounting_outbox_entries_subsidiary_id_idx" ON "public"."accounting_outbox_entries"("subsidiary_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_mappings_key_key" ON "public"."account_mappings"("key");

-- CreateIndex
CREATE INDEX "accounting_accounts_account_number_idx" ON "public"."accounting_accounts"("account_number");

-- CreateIndex
CREATE INDEX "accounting_accounts_is_active_idx" ON "public"."accounting_accounts"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_journals_code_key" ON "public"."accounting_journals"("code");

-- CreateIndex
CREATE INDEX "fiscal_years_subsidiary_id_start_date_end_date_idx" ON "public"."fiscal_years"("subsidiary_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "journal_entries_subsidiary_id_status_idx" ON "public"."journal_entries"("subsidiary_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_subsidiary_id_sequential_number_key" ON "public"."journal_entries"("subsidiary_id", "sequential_number");

-- AddForeignKey
ALTER TABLE "public"."accounting_journal_sequences" ADD CONSTRAINT "accounting_journal_sequences_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "public"."accounting_journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_journal_sequences" ADD CONSTRAINT "accounting_journal_sequences_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "public"."fiscal_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "public"."accounting_journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_reversal_of_entry_id_fkey" FOREIGN KEY ("reversal_of_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
