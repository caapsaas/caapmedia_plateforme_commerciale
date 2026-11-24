-- AlterEnum
ALTER TYPE "public"."UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "public"."subsidiaries" ADD COLUMN     "is_headquarter" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "roles" "public"."UserRole"[] DEFAULT ARRAY[]::"public"."UserRole"[];

-- Backfill: roles[] devient la source de verite RBAC, calculee depuis les
-- champs legacy user_role + additional_roles (dedupliques). Les champs legacy
-- restent en place jusqu'a la phase 4 (guards unifies) pour ne rien casser
-- entre-temps. Voir Doc/architecture-multi-filiale-auth-rbac.md.
UPDATE "public"."users"
SET "roles" = ARRAY(
  SELECT DISTINCT unnested
  FROM UNNEST(ARRAY["user_role"] || "additional_roles") AS unnested
);
