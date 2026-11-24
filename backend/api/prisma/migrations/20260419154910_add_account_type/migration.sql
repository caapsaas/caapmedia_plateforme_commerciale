-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('BANQUE', 'CAISSE', 'COMPTE_PREFINANCEMENT');

-- AlterTable
ALTER TABLE "public"."treasury_accounts" ADD COLUMN     "account_type" "public"."AccountType" NOT NULL DEFAULT 'BANQUE';
