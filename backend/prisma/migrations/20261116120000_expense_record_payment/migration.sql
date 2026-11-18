ALTER TABLE "expense_records" ADD COLUMN "payment_transaction_id" TEXT;

CREATE UNIQUE INDEX "expense_records_payment_transaction_id_key"
ON "expense_records"("payment_transaction_id");

ALTER TABLE "expense_records"
ADD CONSTRAINT "expense_records_payment_transaction_id_fkey"
FOREIGN KEY ("payment_transaction_id") REFERENCES "financial_transactions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
