-- CreateEnum
CREATE TYPE "public"."ExternalTransactionType" AS ENUM ('INVESTMENT', 'LOAN', 'DONATION', 'PERSONAL_EXPENSE', 'PERSONAL_INCOME', 'OTHER_FINANCIAL');

-- CreateEnum
CREATE TYPE "public"."ExternalTransactionCategory" AS ENUM ('REAL_ESTATE', 'VEHICLE', 'EQUIPMENT', 'EDUCATION', 'HEALTH', 'TRAVEL', 'ENTERTAINMENT', 'PERSONAL_SAVINGS', 'FAMILY_SUPPORT', 'CHARITY', 'INVESTMENT_RETURN', 'TAX_REFUND', 'INSURANCE_PAYOUT', 'LEGAL_SETTLEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExternalTransactionStatus" AS ENUM ('DRAFT', 'VALIDATED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."external_financial_transactions" (
    "id" UUID NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "external_transaction_type" "public"."ExternalTransactionType" NOT NULL,
    "external_transaction_category" "public"."ExternalTransactionCategory" NOT NULL,
    "status" "public"."ExternalTransactionStatus" NOT NULL,
    "payment_method" "public"."PaymentMethod" NOT NULL,
    "reference_number" VARCHAR(100),
    "related_document_url" TEXT,
    "created_by" UUID NOT NULL,
    "subsidiary_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "external_financial_transactions_subsidiary_id_transaction_d_idx" ON "public"."external_financial_transactions"("subsidiary_id", "transaction_date");

-- CreateIndex
CREATE INDEX "external_financial_transactions_external_transaction_type_idx" ON "public"."external_financial_transactions"("external_transaction_type");

-- CreateIndex
CREATE INDEX "external_financial_transactions_external_transaction_catego_idx" ON "public"."external_financial_transactions"("external_transaction_category");

-- CreateIndex
CREATE INDEX "external_financial_transactions_status_idx" ON "public"."external_financial_transactions"("status");

-- CreateIndex
CREATE INDEX "external_financial_transactions_created_by_idx" ON "public"."external_financial_transactions"("created_by");

-- AddForeignKey
ALTER TABLE "public"."external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
