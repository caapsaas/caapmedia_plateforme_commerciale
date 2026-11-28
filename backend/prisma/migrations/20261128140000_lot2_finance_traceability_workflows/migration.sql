-- Lot 2: Socle Financier, Tracabilite Transactions, Charges 3 Temps, Imprest, Remises Ecarts, Avoirs Fournisseurs, Prefinancement & Externe

-- 1. Enum TransactionStatus (+ REVERSED)
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'REVERSED';

-- 2. Nouveaux enums Lot 2
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ExpenseStatus') THEN
    CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING_INVOICE', 'DRAFT', 'APPROVED', 'REJECTED', 'PAID');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupplierCreditNoteStatus') THEN
    CREATE TYPE "SupplierCreditNoteStatus" AS ENUM ('ACTIVE', 'APPLIED', 'CANCELLED');
  END IF;
END $$;

-- 3. Seuils financiers configurables par filiale
ALTER TABLE "subsidiaries"
  ADD COLUMN IF NOT EXISTS "expense_box_unit_limit" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "expense_box_imprest_ceiling" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "safe_maker_checker_threshold" DECIMAL(15,2);

-- 4. Tracabilite totale et contre-passation sur financial_transactions
ALTER TABLE "financial_transactions"
  ADD COLUMN IF NOT EXISTS "balance_before_source" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "balance_before_dest" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "gross_amount" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "fees_amount" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "proof_file_path" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "rejection_reason" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "reversed_transaction_id" TEXT,
  ADD COLUMN IF NOT EXISTS "is_reversed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "reversal_reason" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "reversed_by_user_id" TEXT,
  ADD COLUMN IF NOT EXISTS "reversed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "supplier_debt_id" TEXT;

-- 5. Charges en 3 temps & charges variables
ALTER TABLE "expense_records"
  ADD COLUMN IF NOT EXISTS "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "proof_file_path" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "rejection_reason" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "created_by_id" TEXT,
  ADD COLUMN IF NOT EXISTS "approved_by_id" TEXT,
  ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3);

-- Preserver la compatibilite des charges historiques
UPDATE "expense_records"
SET "status" = CASE
  WHEN "payment_transaction_id" IS NOT NULL THEN 'PAID'::"ExpenseStatus"
  ELSE 'APPROVED'::"ExpenseStatus"
END;

CREATE INDEX IF NOT EXISTS "expense_records_status_idx" ON "expense_records"("status");

ALTER TABLE "recurring_expenses"
  ADD COLUMN IF NOT EXISTS "is_variable_amount" BOOLEAN NOT NULL DEFAULT false;

-- 6. Avoirs fournisseurs
CREATE TABLE IF NOT EXISTS "supplier_credit_notes" (
  "id" TEXT NOT NULL,
  "credit_note_number" VARCHAR(80) NOT NULL,
  "supplier_name" VARCHAR(255) NOT NULL,
  "supplier_debt_id" TEXT,
  "purchase_order_id" TEXT,
  "amount" DECIMAL(15,2) NOT NULL,
  "applied_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "reason" VARCHAR(500) NOT NULL,
  "proof_file_path" VARCHAR(500),
  "status" "SupplierCreditNoteStatus" NOT NULL DEFAULT 'ACTIVE',
  "subsidiary_id" TEXT NOT NULL,
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "supplier_credit_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "supplier_credit_notes_credit_note_number_key" ON "supplier_credit_notes"("credit_note_number");
CREATE INDEX IF NOT EXISTS "supplier_credit_notes_subsidiary_id_status_idx" ON "supplier_credit_notes"("subsidiary_id", "status");
CREATE INDEX IF NOT EXISTS "supplier_credit_notes_supplier_debt_id_idx" ON "supplier_credit_notes"("supplier_debt_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_credit_notes_supplier_debt_id_fkey') THEN
    ALTER TABLE "supplier_credit_notes"
      ADD CONSTRAINT "supplier_credit_notes_supplier_debt_id_fkey"
      FOREIGN KEY ("supplier_debt_id") REFERENCES "supplier_debts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_credit_notes_subsidiary_id_fkey') THEN
    ALTER TABLE "supplier_credit_notes"
      ADD CONSTRAINT "supplier_credit_notes_subsidiary_id_fkey"
      FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 7. Branchement reel Prefinancement & Operations externes
ALTER TABLE "PrefinancementTransaction"
  ADD COLUMN IF NOT EXISTS "treasury_account_id" TEXT,
  ADD COLUMN IF NOT EXISTS "financial_transaction_id" TEXT,
  ADD COLUMN IF NOT EXISTS "validated_by_id" TEXT,
  ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMP(3);

ALTER TABLE "external_financial_transactions"
  ADD COLUMN IF NOT EXISTS "impacts_treasury" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "treasury_account_id" TEXT,
  ADD COLUMN IF NOT EXISTS "financial_transaction_id" TEXT,
  ADD COLUMN IF NOT EXISTS "validated_by_id" TEXT,
  ADD COLUMN IF NOT EXISTS "validated_at" TIMESTAMP(3);
