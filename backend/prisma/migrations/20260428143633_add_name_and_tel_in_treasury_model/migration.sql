-- AlterTable
ALTER TABLE "public"."financial_transactions" ADD COLUMN     "provider_name" VARCHAR(255),
ADD COLUMN     "provider_phone" VARCHAR(20);

-- AlterTable
ALTER TABLE "public"."treasury_accounts" ALTER COLUMN "account_type" DROP DEFAULT;
