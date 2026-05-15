-- CreateEnum
CREATE TYPE "public"."AccountingAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."accounting_accounts" (
    "id" UUID NOT NULL,
    "account_number" VARCHAR(10) NOT NULL,
    "account_name" VARCHAR(255) NOT NULL,
    "account_type" "public"."AccountingAccountType" NOT NULL,
    "parent_account_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "subsidiary_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fiscal_years" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "subsidiary_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_entries" (
    "id" UUID NOT NULL,
    "entry_number" VARCHAR(50) NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DECIMAL(15,2) NOT NULL,
    "fiscal_year_id" UUID NOT NULL,
    "subsidiary_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_entry_lines" (
    "id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "debit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounting_accounts_account_number_key" ON "public"."accounting_accounts"("account_number");

-- CreateIndex
CREATE INDEX "accounting_accounts_subsidiary_id_account_number_idx" ON "public"."accounting_accounts"("subsidiary_id", "account_number");

-- CreateIndex
CREATE INDEX "fiscal_years_subsidiary_id_is_active_idx" ON "public"."fiscal_years"("subsidiary_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_years_subsidiary_id_name_key" ON "public"."fiscal_years"("subsidiary_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entry_number_key" ON "public"."journal_entries"("entry_number");

-- CreateIndex
CREATE INDEX "journal_entries_subsidiary_id_entry_date_idx" ON "public"."journal_entries"("subsidiary_id", "entry_date");

-- CreateIndex
CREATE INDEX "journal_entries_status_idx" ON "public"."journal_entries"("status");

-- CreateIndex
CREATE INDEX "journal_entries_fiscal_year_id_idx" ON "public"."journal_entries"("fiscal_year_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journal_entry_id_idx" ON "public"."journal_entry_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_account_id_idx" ON "public"."journal_entry_lines"("account_id");

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_years" ADD CONSTRAINT "fiscal_years_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "public"."fiscal_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounting_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
