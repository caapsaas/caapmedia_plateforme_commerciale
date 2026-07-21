-- Ancien système de variantes produit (ConfigurableOption), superseded by le
-- moteur de spécifications configurables (Chantier 5 : ProductSpecification /
-- ProductSpecGroup / SpecReferenceList). Plus lu ni écrit nulle part dans le
-- code applicatif (audité avant suppression) : le catalogue de services
-- actuel ne le peuple plus (ServiceFormModal.tsx ne l'écrit plus), et il ne
-- concernait de toute façon jamais les produits de stock.

-- DropForeignKey
ALTER TABLE "configurable_options" DROP CONSTRAINT IF EXISTS "configurable_options_productId_fkey";
ALTER TABLE "configurable_options" DROP CONSTRAINT IF EXISTS "configurable_options_itemId_fkey";

-- DropTable
DROP TABLE IF EXISTS "configurable_options";
DROP TABLE IF EXISTS "configurable_option_item";

-- DropEnum
DROP TYPE IF EXISTS "OptionType";
