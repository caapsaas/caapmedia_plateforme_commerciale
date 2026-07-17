-- Auto-generated migration: Convert all UUID columns to TEXT
-- Uses PostgreSQL information_schema to dynamically handle all tables

-- Step 1: Disable all constraints temporarily
ALTER TABLE IF EXISTS "public"."subsidiaries" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."users" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."products" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employees" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."contacts" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."suppliers" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."orders" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."order_item" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."product_image" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."configurable_option_item" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."configurable_options" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."product_option" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."order_production_history" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."sale" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."opportunities" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."interactions" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."crm_tasks" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."leads" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."meetings" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."contracts" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."equipment" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."maintenance_records" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."treasury_accounts" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."company_documents" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."expense_records" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."financial_transactions" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."credit_account" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."supplier_debts" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."long_term_debts" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."fixed_assets" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."external_financial_transactions" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."notifications" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_documents" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_position_history" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_trainings" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_performance_reviews" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_leave_records" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_leave_balances" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."absence_records" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."attendance_records" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."payroll_records" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."accounting_accounts" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."accounting_journals" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."account_mappings" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."journal_entries" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."journal_entry_lines" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."accounting_periods" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."fiscal_years" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."balance_sheets" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."income_statements" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."purchase_orders" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."purchase_order_items" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."opportunity_products" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."proformas" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."proforma_items" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."order_group" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."kpi" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."secretariat_tasks" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."newsletters" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."treasure_transactions" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."product_subsidiary" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."meeting_participants" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."PrefinancementAccount" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."PrefinancementTransaction" DISABLE TRIGGER ALL;

-- Step 2: Drop ALL foreign key constraints dynamically
DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT constraint_name, table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I.%I DROP CONSTRAINT IF EXISTS %I', 'public', fk.table_name, fk.constraint_name);
  END LOOP;
END $$;

-- Step 3: Drop all PRIMARY KEY constraints
DO $$
DECLARE
  pk RECORD;
BEGIN
  FOR pk IN
    SELECT constraint_name, table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'PRIMARY KEY'
    AND table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS %I.%I DROP CONSTRAINT IF EXISTS %I', 'public', pk.table_name, pk.constraint_name);
  END LOOP;
END $$;

-- Step 4: ALTER all UUID columns to TEXT
DO $$
DECLARE
  col RECORD;
BEGIN
  FOR col IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE data_type = 'uuid'
    AND table_schema = 'public'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE IF EXISTS %I.%I ALTER COLUMN %I TYPE TEXT USING %I::TEXT', 'public', col.table_name, col.column_name, col.column_name);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- Step 5: Re-add all PRIMARY KEY constraints
DO $$
DECLARE
  pk RECORD;
  columns TEXT;
BEGIN
  FOR pk IN
    SELECT constraint_name, table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'PRIMARY KEY'
    AND table_schema = 'public'
  LOOP
    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO columns
    FROM information_schema.constraint_column_usage
    WHERE constraint_name = pk.constraint_name
    AND table_schema = 'public';

    IF columns IS NOT NULL THEN
      BEGIN
        EXECUTE format('ALTER TABLE IF EXISTS %I.%I ADD CONSTRAINT %I PRIMARY KEY (%s)', 'public', pk.table_name, pk.constraint_name, columns);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- Step 6: Re-add all FOREIGN KEY constraints
DO $$
DECLARE
  fk RECORD;
  columns TEXT;
  ref_columns TEXT;
  update_rule TEXT;
  delete_rule TEXT;
BEGIN
  FOR fk IN
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table_name,
      ccu.column_name AS referenced_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc ON rc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  LOOP
    -- Collect all columns for this FK
    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO columns
    FROM information_schema.key_column_usage
    WHERE constraint_name = fk.constraint_name
    AND table_schema = 'public'
    AND table_name = fk.table_name;

    SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) INTO ref_columns
    FROM information_schema.constraint_column_usage
    WHERE constraint_name = fk.constraint_name
    AND table_schema = 'public'
    AND table_name = fk.referenced_table_name;

    IF columns IS NOT NULL AND ref_columns IS NOT NULL THEN
      BEGIN
        EXECUTE format(
          'ALTER TABLE IF EXISTS %I.%I ADD CONSTRAINT %I FOREIGN KEY (%s) REFERENCES %I.%I (%s) ON UPDATE %s ON DELETE %s',
          'public', fk.table_name, fk.constraint_name,
          columns,
          'public', fk.referenced_table_name, ref_columns,
          fk.update_rule, fk.delete_rule
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- Step 7: Re-enable all triggers
ALTER TABLE IF EXISTS "public"."subsidiaries" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."users" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."products" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employees" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."contacts" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."suppliers" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."orders" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."order_item" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."product_image" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."configurable_option_item" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."configurable_options" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."product_option" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."order_production_history" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."sale" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."opportunities" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."interactions" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."crm_tasks" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."leads" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."meetings" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."contracts" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."equipment" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."maintenance_records" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."treasury_accounts" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."company_documents" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."expense_records" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."financial_transactions" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."credit_account" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."supplier_debts" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."long_term_debts" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."fixed_assets" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."external_financial_transactions" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."notifications" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_documents" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_position_history" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_trainings" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_performance_reviews" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_leave_records" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."employee_leave_balances" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."absence_records" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."attendance_records" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."payroll_records" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."accounting_accounts" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."accounting_journals" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."account_mappings" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."journal_entries" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."journal_entry_lines" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."accounting_periods" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."fiscal_years" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."balance_sheets" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."income_statements" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."purchase_orders" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."purchase_order_items" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."opportunity_products" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."proformas" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."proforma_items" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."order_group" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."kpi" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."secretariat_tasks" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."newsletters" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."treasure_transactions" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."product_subsidiary" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."meeting_participants" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."PrefinancementAccount" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "public"."PrefinancementTransaction" ENABLE TRIGGER ALL;
