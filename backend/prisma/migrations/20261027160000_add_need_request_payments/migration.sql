-- CreateTable
CREATE TABLE "need_request_payments" (
    "id" TEXT NOT NULL,
    "needRequestId" TEXT NOT NULL,
    "financialTransactionId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "beneficiary" VARCHAR(255) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "reference" VARCHAR(100),
    "paidAt" TIMESTAMP(3) NOT NULL,
    "paidById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "need_request_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "need_request_payments_needRequestId_key" ON "need_request_payments"("needRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "need_request_payments_financialTransactionId_key" ON "need_request_payments"("financialTransactionId");

-- AddForeignKey
ALTER TABLE "need_request_payments" ADD CONSTRAINT "need_request_payments_needRequestId_fkey" FOREIGN KEY ("needRequestId") REFERENCES "need_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_request_payments" ADD CONSTRAINT "need_request_payments_financialTransactionId_fkey" FOREIGN KEY ("financialTransactionId") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_request_payments" ADD CONSTRAINT "need_request_payments_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
