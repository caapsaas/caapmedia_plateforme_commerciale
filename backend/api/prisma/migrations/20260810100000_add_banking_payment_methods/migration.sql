-- AlterEnum
ALTER TYPE "customer_payment_method" ADD VALUE IF NOT EXISTS 'CASH';
ALTER TYPE "customer_payment_method" ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';
ALTER TYPE "customer_payment_method" ADD VALUE IF NOT EXISTS 'CHECK';
