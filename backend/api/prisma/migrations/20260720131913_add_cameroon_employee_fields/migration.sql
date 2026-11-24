-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "bank_account_number" VARCHAR(50),
ADD COLUMN     "category_code_cnps" VARCHAR(1) NOT NULL DEFAULT 'B',
ADD COLUMN     "cnps_number" VARCHAR(20),
ADD COLUMN     "cnps_number_encrypted" TEXT,
ADD COLUMN     "number_dependents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "situation_matrimony" VARCHAR(20) NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "tax_id_ntif" VARCHAR(15);
