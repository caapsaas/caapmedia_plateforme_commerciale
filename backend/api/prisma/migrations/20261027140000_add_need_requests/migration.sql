-- CreateEnum
CREATE TYPE "NeedRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "need_requests" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedBudget" DECIMAL(15,2),
    "desiredDate" DATE,
    "status" "NeedRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "subsidiaryId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "need_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "need_requests_subsidiaryId_requesterId_createdAt_idx" ON "need_requests"("subsidiaryId", "requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "need_requests_status_createdAt_idx" ON "need_requests"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "need_requests" ADD CONSTRAINT "need_requests_subsidiaryId_fkey" FOREIGN KEY ("subsidiaryId") REFERENCES "subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_requests" ADD CONSTRAINT "need_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "need_requests" ADD CONSTRAINT "need_requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
