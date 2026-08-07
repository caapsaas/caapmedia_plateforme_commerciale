-- AlterEnum
-- CAISSE (caisse générale) fusionnée dans CASH_REGISTER (caisse de
-- vente/POS) : aucune ligne treasury_accounts n'utilise plus CAISSE
-- (nettoyées avant cette migration), suppression sûre de la valeur.
BEGIN;
CREATE TYPE "AccountType_new" AS ENUM ('BANQUE', 'COMPTE_PREFINANCEMENT', 'SAFE', 'EXPENSE_BOX', 'CASH_REGISTER');
ALTER TABLE "treasury_accounts" ALTER COLUMN "account_type" TYPE "AccountType_new" USING ("account_type"::text::"AccountType_new");
ALTER TYPE "AccountType" RENAME TO "AccountType_old";
ALTER TYPE "AccountType_new" RENAME TO "AccountType";
DROP TYPE "AccountType_old";
COMMIT;
