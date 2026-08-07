-- Suppression du modèle CreditAccount : jamais utilisé côté backend (aucun
-- service/contrôleur ne le lisait ni ne l'écrivait, table vide). Les
-- créances clients sont dérivées directement des Order avec
-- paymentStatus != PAID (voir CreditManagement.tsx / apiOrders.ts) — une
-- seule source de vérité, pas de table dupliquée à synchroniser.
ALTER TABLE "credit_account" DROP CONSTRAINT IF EXISTS "credit_account_contact_id_fkey";
ALTER TABLE "credit_account" DROP CONSTRAINT IF EXISTS "credit_account_subsidiary_id_fkey";
DROP TABLE IF EXISTS "credit_account";
