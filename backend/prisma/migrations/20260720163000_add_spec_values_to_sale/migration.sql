-- Chantier 5 (Caisse) : la vente directe au comptoir peut désormais collecter
-- les spécifications techniques d'un service, comme une commande classique.
ALTER TABLE "sale" ADD COLUMN "spec_values" JSONB;
ALTER TABLE "sale" ADD COLUMN "spec_snapshot" JSONB;
