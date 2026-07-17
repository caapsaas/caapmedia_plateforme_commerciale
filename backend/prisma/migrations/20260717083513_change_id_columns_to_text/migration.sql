/*
  Warnings:

  - You are about to drop the column `userId` on the `PrefinancementAccount` table. All the data in the column will be lost.
  - The primary key for the `absence_records` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `account_mappings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `accounting_accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `accounting_journals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `attendance_records` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `company_documents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `contacts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `contracts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `credit_account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `crm_tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `employee_leave_balances` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `employees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `equipment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `expense_records` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `external_financial_transactions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `financial_transactions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `fiscal_years` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `fixed_assets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `interactions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `journal_entries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `journal_entry_lines` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `kpi` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `leads` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `long_term_debts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `maintenance_records` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `meetings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `newsletters` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `notifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `opportunities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `opportunity_products` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `order_group` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `order_item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `payroll_records` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `products` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `proforma_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `proformas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `purchase_orders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sale` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `secretariat_tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `subsidiaries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `supplier_debts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `suppliers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tax_rates` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `treasury_accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."PrefinancementAccount" DROP CONSTRAINT "PrefinancementAccount_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."PrefinancementAccount" DROP CONSTRAINT "PrefinancementAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PrefinancementTransaction" DROP CONSTRAINT "PrefinancementTransaction_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."PrefinancementTransaction" DROP CONSTRAINT "PrefinancementTransaction_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."absence_records" DROP CONSTRAINT "absence_records_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."absence_records" DROP CONSTRAINT "absence_records_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."account_mappings" DROP CONSTRAINT "account_mappings_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounting_accounts" DROP CONSTRAINT "accounting_accounts_parent_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounting_accounts" DROP CONSTRAINT "accounting_accounts_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounting_journals" DROP CONSTRAINT "accounting_journals_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."attendance_records" DROP CONSTRAINT "attendance_records_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."attendance_records" DROP CONSTRAINT "attendance_records_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."company_documents" DROP CONSTRAINT "company_documents_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."configurable_options" DROP CONSTRAINT "configurable_options_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contacts" DROP CONSTRAINT "contacts_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contacts" DROP CONSTRAINT "contacts_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contacts" DROP CONSTRAINT "contacts_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contracts" DROP CONSTRAINT "contracts_client_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."contracts" DROP CONSTRAINT "contracts_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."credit_account" DROP CONSTRAINT "credit_account_contact_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."credit_account" DROP CONSTRAINT "credit_account_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."crm_tasks" DROP CONSTRAINT "crm_tasks_contact_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."crm_tasks" DROP CONSTRAINT "crm_tasks_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."crm_tasks" DROP CONSTRAINT "crm_tasks_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employee_documents" DROP CONSTRAINT "employee_documents_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employee_leave_balances" DROP CONSTRAINT "employee_leave_balances_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employee_leave_records" DROP CONSTRAINT "employee_leave_records_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employee_performance_reviews" DROP CONSTRAINT "employee_performance_reviews_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employee_position_history" DROP CONSTRAINT "employee_position_history_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employee_trainings" DROP CONSTRAINT "employee_trainings_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."equipment" DROP CONSTRAINT "equipment_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."expense_records" DROP CONSTRAINT "expense_records_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."external_financial_transactions" DROP CONSTRAINT "external_financial_transactions_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."external_financial_transactions" DROP CONSTRAINT "external_financial_transactions_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."financial_transactions" DROP CONSTRAINT "financial_transactions_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."financial_transactions" DROP CONSTRAINT "financial_transactions_treasury_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."fiscal_years" DROP CONSTRAINT "fiscal_years_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."fixed_assets" DROP CONSTRAINT "fixed_assets_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."interactions" DROP CONSTRAINT "interactions_contact_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."interactions" DROP CONSTRAINT "interactions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_fiscal_year_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entry_lines" DROP CONSTRAINT "journal_entry_lines_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."journal_entry_lines" DROP CONSTRAINT "journal_entry_lines_journal_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."long_term_debts" DROP CONSTRAINT "long_term_debts_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."maintenance_records" DROP CONSTRAINT "maintenance_records_equipment_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."meeting_participants" DROP CONSTRAINT "meeting_participants_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."meeting_participants" DROP CONSTRAINT "meeting_participants_meeting_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."meetings" DROP CONSTRAINT "meetings_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."opportunities" DROP CONSTRAINT "opportunities_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."opportunities" DROP CONSTRAINT "opportunities_contact_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."opportunities" DROP CONSTRAINT "opportunities_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."opportunities" DROP CONSTRAINT "opportunities_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."opportunity_products" DROP CONSTRAINT "opportunity_products_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."opportunity_products" DROP CONSTRAINT "opportunity_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_item" DROP CONSTRAINT "order_item_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_item" DROP CONSTRAINT "order_item_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_production_history" DROP CONSTRAINT "order_production_history_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_tax_rate_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payroll_records" DROP CONSTRAINT "payroll_records_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payroll_records" DROP CONSTRAINT "payroll_records_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_image" DROP CONSTRAINT "product_image_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_option" DROP CONSTRAINT "product_option_order_item_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."proforma_items" DROP CONSTRAINT "proforma_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."proforma_items" DROP CONSTRAINT "proforma_items_proforma_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."proformas" DROP CONSTRAINT "proformas_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."proformas" DROP CONSTRAINT "proformas_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."proformas" DROP CONSTRAINT "proformas_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."proformas" DROP CONSTRAINT "proformas_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_order_history" DROP CONSTRAINT "purchase_order_history_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_order_items" DROP CONSTRAINT "purchase_order_items_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_orders" DROP CONSTRAINT "purchase_orders_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchase_orders" DROP CONSTRAINT "purchase_orders_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sale" DROP CONSTRAINT "sale_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sale" DROP CONSTRAINT "sale_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sale" DROP CONSTRAINT "sale_sales_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."sale" DROP CONSTRAINT "sale_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."secretariat_tasks" DROP CONSTRAINT "secretariat_tasks_assigned_to_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."secretariat_tasks" DROP CONSTRAINT "secretariat_tasks_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."supplier_debts" DROP CONSTRAINT "supplier_debts_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."supplier_debts" DROP CONSTRAINT "supplier_debts_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."suppliers" DROP CONSTRAINT "suppliers_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."treasury_accounts" DROP CONSTRAINT "treasury_accounts_subsidiary_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_subsidiary_id_fkey";

-- AlterTable
ALTER TABLE "public"."PrefinancementAccount" DROP COLUMN "userId",
ADD COLUMN     "user_id" TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."PrefinancementTransaction" ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."absence_records" DROP CONSTRAINT "absence_records_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "employee_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "absence_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."account_mappings" DROP CONSTRAINT "account_mappings_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "account_mappings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."accounting_accounts" DROP CONSTRAINT "accounting_accounts_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "parent_account_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "accounting_accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."accounting_journals" DROP CONSTRAINT "accounting_journals_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "accounting_journals_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ALTER COLUMN "sales_rep_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."attendance_records" DROP CONSTRAINT "attendance_records_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "employee_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."company_documents" DROP CONSTRAINT "company_documents_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."configurable_options" ALTER COLUMN "product_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."contacts" DROP CONSTRAINT "contacts_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "account_id" SET DATA TYPE TEXT,
ALTER COLUMN "sales_rep_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."contracts" DROP CONSTRAINT "contracts_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "client_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."credit_account" DROP CONSTRAINT "credit_account_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ALTER COLUMN "contact_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "credit_account_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."crm_tasks" DROP CONSTRAINT "crm_tasks_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "contact_id" SET DATA TYPE TEXT,
ALTER COLUMN "opportunity_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."employee_documents" ALTER COLUMN "employee_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."employee_leave_balances" DROP CONSTRAINT "employee_leave_balances_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "employee_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "employee_leave_balances_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."employee_leave_records" ALTER COLUMN "employee_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."employee_performance_reviews" ALTER COLUMN "employee_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."employee_position_history" ALTER COLUMN "employee_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."employee_trainings" ALTER COLUMN "employee_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ALTER COLUMN "manager_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."equipment" DROP CONSTRAINT "equipment_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "equipment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."expense_records" DROP CONSTRAINT "expense_records_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "expense_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."external_financial_transactions" DROP CONSTRAINT "external_financial_transactions_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "external_financial_transactions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."financial_transactions" DROP CONSTRAINT "financial_transactions_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ALTER COLUMN "treasury_account_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."fiscal_years" DROP CONSTRAINT "fiscal_years_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."fixed_assets" DROP CONSTRAINT "fixed_assets_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."interactions" DROP CONSTRAINT "interactions_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "contact_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."journal_entries" DROP CONSTRAINT "journal_entries_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "fiscal_year_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "journal_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."journal_entry_lines" DROP CONSTRAINT "journal_entry_lines_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "journal_entry_id" SET DATA TYPE TEXT,
ALTER COLUMN "account_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."kpi" DROP CONSTRAINT "kpi_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "kpi_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."leads" DROP CONSTRAINT "leads_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "sales_rep_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."long_term_debts" DROP CONSTRAINT "long_term_debts_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "long_term_debts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."maintenance_records" DROP CONSTRAINT "maintenance_records_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "equipment_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."meeting_participants" ALTER COLUMN "meeting_id" SET DATA TYPE TEXT,
ALTER COLUMN "employee_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."meetings" DROP CONSTRAINT "meetings_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."newsletters" DROP CONSTRAINT "newsletters_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."notifications" DROP CONSTRAINT "notifications_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "order_id" SET DATA TYPE TEXT,
ALTER COLUMN "recipient_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."opportunities" DROP CONSTRAINT "opportunities_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "contact_id" SET DATA TYPE TEXT,
ALTER COLUMN "account_id" SET DATA TYPE TEXT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."opportunity_products" DROP CONSTRAINT "opportunity_products_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "opportunity_id" SET DATA TYPE TEXT,
ALTER COLUMN "product_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "opportunity_products_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."order_group" DROP CONSTRAINT "order_group_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "customer_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "order_group_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."order_item" DROP CONSTRAINT "order_item_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "product_id" SET DATA TYPE TEXT,
ALTER COLUMN "order_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "order_item_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."order_production_history" ALTER COLUMN "order_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "customer_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ALTER COLUMN "tax_rate_id" SET DATA TYPE TEXT,
ALTER COLUMN "sales_rep_id" SET DATA TYPE TEXT,
ALTER COLUMN "opportunity_id" SET DATA TYPE TEXT,
ALTER COLUMN "group_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."payroll_records" DROP CONSTRAINT "payroll_records_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "employee_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."product_image" ALTER COLUMN "product_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."product_option" ALTER COLUMN "order_item_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."products" DROP CONSTRAINT "products_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."proforma_items" DROP CONSTRAINT "proforma_items_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "proforma_id" SET DATA TYPE TEXT,
ALTER COLUMN "product_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "proforma_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."proformas" DROP CONSTRAINT "proformas_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "lead_id" SET DATA TYPE TEXT,
ALTER COLUMN "opportunity_id" SET DATA TYPE TEXT,
ALTER COLUMN "created_by" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "proformas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."purchase_order_history" ALTER COLUMN "purchase_order_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."purchase_order_items" ALTER COLUMN "purchase_order_id" SET DATA TYPE TEXT,
ALTER COLUMN "product_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."purchase_orders" DROP CONSTRAINT "purchase_orders_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "supplier_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."sale" DROP CONSTRAINT "sale_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "customer_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ALTER COLUMN "sales_rep_id" SET DATA TYPE TEXT,
ALTER COLUMN "order_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "sale_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."secretariat_tasks" DROP CONSTRAINT "secretariat_tasks_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "assigned_to_id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "secretariat_tasks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."subsidiaries" DROP CONSTRAINT "subsidiaries_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "subsidiaries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."supplier_debts" DROP CONSTRAINT "supplier_debts_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ALTER COLUMN "purchase_order_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "supplier_debts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."suppliers" DROP CONSTRAINT "suppliers_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."tax_rates" DROP CONSTRAINT "tax_rates_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."treasury_accounts" DROP CONSTRAINT "treasury_accounts_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "treasury_accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."users" DROP CONSTRAINT "users_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subsidiary_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."configurable_options" ADD CONSTRAINT "configurable_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_image" ADD CONSTRAINT "product_image_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_documents" ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_position_history" ADD CONSTRAINT "employee_position_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_trainings" ADD CONSTRAINT "employee_trainings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_performance_reviews" ADD CONSTRAINT "employee_performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_leave_records" ADD CONSTRAINT "employee_leave_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_leave_balances" ADD CONSTRAINT "employee_leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale" ADD CONSTRAINT "sale_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale" ADD CONSTRAINT "sale_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale" ADD CONSTRAINT "sale_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale" ADD CONSTRAINT "sale_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunities" ADD CONSTRAINT "opportunities_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunities" ADD CONSTRAINT "opportunities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunities" ADD CONSTRAINT "opportunities_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunities" ADD CONSTRAINT "opportunities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunity_products" ADD CONSTRAINT "opportunity_products_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunity_products" ADD CONSTRAINT "opportunity_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."order_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_tax_rate_id_fkey" FOREIGN KEY ("tax_rate_id") REFERENCES "public"."tax_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_production_history" ADD CONSTRAINT "order_production_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_option" ADD CONSTRAINT "product_option_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."suppliers" ADD CONSTRAINT "suppliers_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_history" ADD CONSTRAINT "purchase_order_history_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_account" ADD CONSTRAINT "credit_account_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_account" ADD CONSTRAINT "credit_account_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treasury_accounts" ADD CONSTRAINT "treasury_accounts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_treasury_account_id_fkey" FOREIGN KEY ("treasury_account_id") REFERENCES "public"."treasury_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_documents" ADD CONSTRAINT "company_documents_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meetings" ADD CONSTRAINT "meetings_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_participants" ADD CONSTRAINT "meeting_participants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secretariat_tasks" ADD CONSTRAINT "secretariat_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secretariat_tasks" ADD CONSTRAINT "secretariat_tasks_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interactions" ADD CONSTRAINT "interactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interactions" ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_tasks" ADD CONSTRAINT "crm_tasks_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_tasks" ADD CONSTRAINT "crm_tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_tasks" ADD CONSTRAINT "crm_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixed_assets" ADD CONSTRAINT "fixed_assets_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."long_term_debts" ADD CONSTRAINT "long_term_debts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_records" ADD CONSTRAINT "maintenance_records_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."absence_records" ADD CONSTRAINT "absence_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."absence_records" ADD CONSTRAINT "absence_records_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_records" ADD CONSTRAINT "payroll_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_records" ADD CONSTRAINT "payroll_records_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_debts" ADD CONSTRAINT "supplier_debts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier_debts" ADD CONSTRAINT "supplier_debts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."expense_records" ADD CONSTRAINT "expense_records_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "public"."accounting_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_accounts" ADD CONSTRAINT "accounting_accounts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fiscal_years" ADD CONSTRAINT "fiscal_years_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounting_journals" ADD CONSTRAINT "accounting_journals_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_mappings" ADD CONSTRAINT "account_mappings_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "public"."fiscal_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entries" ADD CONSTRAINT "journal_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "public"."accounting_journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounting_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrefinancementAccount" ADD CONSTRAINT "PrefinancementAccount_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrefinancementAccount" ADD CONSTRAINT "PrefinancementAccount_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrefinancementTransaction" ADD CONSTRAINT "PrefinancementTransaction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PrefinancementTransaction" ADD CONSTRAINT "PrefinancementTransaction_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proformas" ADD CONSTRAINT "proformas_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proformas" ADD CONSTRAINT "proformas_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proformas" ADD CONSTRAINT "proformas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proformas" ADD CONSTRAINT "proformas_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proforma_items" ADD CONSTRAINT "proforma_items_proforma_id_fkey" FOREIGN KEY ("proforma_id") REFERENCES "public"."proformas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."proforma_items" ADD CONSTRAINT "proforma_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
