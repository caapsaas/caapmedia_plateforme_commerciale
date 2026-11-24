-- Corrige un drift schema/DB: ces colonnes etaient declarees @db.Uuid dans
-- schema.prisma alors que la vraie colonne, creee TEXT par la migration
-- 20260717100439_complete_uuid_to_text_fixed (conversion en masse) et par
-- 20260721125855_add_production_cost_module, l'est deja. Prisma Client
-- generait donc un bind parameter type "uuid" pour ces champs et Postgres
-- rejetait toute valeur non-UUID (ex: User.id au format "USR-XXXX" genere
-- par generateId()) avec "invalid input syntax for type uuid" -> 500 sur
-- toute sauvegarde touchant equipement_cost_config.updated_by_id,
-- commercial_params.updated_by_id ou stock_movements.created_by_id.
--
-- Ces ALTER sont des no-op au niveau du type physique (deja TEXT) - ils ne
-- font que faire converger l'historique de migrations vers l'etat reel de
-- la base, pour que `prisma migrate dev` cesse de detecter ce drift.
ALTER TABLE "public"."equipement_cost_config" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."equipement_cost_config" ALTER COLUMN "equipment_id" TYPE TEXT;
ALTER TABLE "public"."equipement_cost_config" ALTER COLUMN "updated_by_id" TYPE TEXT;

ALTER TABLE "public"."commercial_params" ALTER COLUMN "id" TYPE TEXT;
ALTER TABLE "public"."commercial_params" ALTER COLUMN "updated_by_id" TYPE TEXT;

ALTER TABLE "public"."stock_movements" ALTER COLUMN "created_by_id" TYPE TEXT;
