ALTER TYPE "TransactionStatus" ADD VALUE 'ANNULE';

ALTER TABLE "financial_transactions"
ADD COLUMN "created_by_user_id" TEXT,
ADD COLUMN "approved_by_user_id" TEXT,
ADD COLUMN "approved_at" TIMESTAMP(3);

CREATE INDEX "financial_transactions_created_by_user_id_idx"
ON "financial_transactions"("created_by_user_id");

CREATE INDEX "financial_transactions_approved_by_user_id_idx"
ON "financial_transactions"("approved_by_user_id");
