-- Restaure le caractere optionnel de subsidiary_id sur dynamic_tokens.
-- Un token dynamique est global (QR code de pointage imprime, valable pour
-- tous les employes actifs quelle que soit la filiale) : il n'est donc lie
-- a aucune Subsidiary. La migration 20260810101547_fix_migration avait
-- reapplique NOT NULL par erreur, cassant DynamicTokenService.

-- AlterTable
ALTER TABLE "public"."dynamic_tokens" ALTER COLUMN "subsidiary_id" DROP NOT NULL;
