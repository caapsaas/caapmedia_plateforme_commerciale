CREATE TABLE "cash_remittance_receipts" (
    "cash_remittance_id" TEXT NOT NULL,
    "financial_transaction_id" TEXT NOT NULL,

    CONSTRAINT "cash_remittance_receipts_pkey" PRIMARY KEY ("cash_remittance_id", "financial_transaction_id")
);

CREATE UNIQUE INDEX "cash_remittance_receipts_financial_transaction_id_key" ON "cash_remittance_receipts"("financial_transaction_id");
CREATE INDEX "cash_remittance_receipts_cash_remittance_id_idx" ON "cash_remittance_receipts"("cash_remittance_id");

ALTER TABLE "cash_remittance_receipts"
ADD CONSTRAINT "cash_remittance_receipts_cash_remittance_id_fkey"
FOREIGN KEY ("cash_remittance_id") REFERENCES "cash_remittances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cash_remittance_receipts"
ADD CONSTRAINT "cash_remittance_receipts_financial_transaction_id_fkey"
FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
