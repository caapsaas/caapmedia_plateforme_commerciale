-- Conversion de toutes les colonnes UUID en TEXT.
--
-- Le script d'origine encadrait la conversion par "ALTER TABLE ... DISABLE TRIGGER ALL" /
-- "ENABLE TRIGGER ALL" sur 64 tables. Ces instructions touchent aux triggers systeme
-- RI_ConstraintTrigger_* qui materialisent les cles etrangeres : seul un role SUPERUSER
-- peut les desactiver. Sur un hebergement mutualise ou une base managee (n0c, Supabase,
-- RDS...), la migration echouait donc des sa premiere instruction avec
-- SQLSTATE 42501 "permission denied: ... is a system trigger".
--
-- Ces instructions etaient de toute facon inutiles : l'etape 1 ci-dessous supprime les
-- cles etrangeres, ce qui retire leurs triggers systeme. Le script d'origine comportait
-- par ailleurs deux etapes de restauration des PRIMARY KEY / FOREIGN KEY qui relisaient
-- information_schema *apres* les DROP, dans la meme transaction : elles ne trouvaient rien
-- et ne restauraient rien, l'erreur etant masquee par des "EXCEPTION WHEN OTHERS THEN NULL".
-- Elles sont supprimees ici car mortes. Les contraintes sont recreees par la migration
-- suivante 20260717101744_fix_product_id_type, qui existe pour cela.
--
-- Le comportement effectif de cette migration est donc inchange, seule la dependance au
-- privilege SUPERUSER disparait.

-- Etape 1 : suppression de toutes les cles etrangeres
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass::text AS tbl, c.conname AS name
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
      AND c.conrelid::regclass::text NOT LIKE '%_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.name);
  END LOOP;
END $$;

-- Etape 2 : suppression de toutes les cles primaires
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass::text AS tbl, c.conname AS name
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'p'
      AND n.nspname = 'public'
      AND c.conrelid::regclass::text NOT LIKE '%_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.name);
  END LOOP;
END $$;

-- Etape 3 : conversion uuid -> TEXT
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.table_name AS tbl, c.column_name AS col
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name   = c.table_name
    WHERE c.table_schema = 'public'
      AND c.data_type    = 'uuid'
      AND t.table_type   = 'BASE TABLE'
  LOOP
    -- un DEFAULT de type uuid (gen_random_uuid()) empecherait le changement de type ;
    -- Prisma genere les identifiants cote application, ce DEFAULT est inutile ici.
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', r.tbl, r.col);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE TEXT USING %I::TEXT', r.tbl, r.col, r.col);
  END LOOP;
END $$;
