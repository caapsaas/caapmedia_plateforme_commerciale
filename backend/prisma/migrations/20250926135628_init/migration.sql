-- CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('ADMIN', 'COMMERCIAL', 'CAISSIER', 'PURCHASING_MANAGER', 'FINANCIAL_DIRECTOR', 'SECRETARY', 'HR_MANAGER', 'PRODUCTION_DIRECTOR');

-- CreateEnum
CREATE TYPE "public"."order_status" AS ENUM ('PENDING_VALIDATION', 'NEW', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."payment_status" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "public"."production_status" AS ENUM ('PREPRESS', 'PRINTING', 'FINISHING', 'READY_FOR_DELIVERY');

-- CreateEnum
CREATE TYPE "public"."contact_status" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."purchase_order_status" AS ENUM ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."payment_terms" AS ENUM ('IMMEDIATE', 'CREDIT', 'DRAFT_PAYMENT');

-- CreateEnum
CREATE TYPE "public"."expense_category" AS ENUM ('RENT', 'SALARIES', 'ADVERTISING', 'TRANSPORT', 'SERVICES', 'INSURANCE', 'PURCHASE_COST', 'COMMISSIONS', 'PACKAGING', 'TRANSACTION_FEES', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."expense_type" AS ENUM ('FIXED', 'VARIABLE');

-- CreateEnum
CREATE TYPE "public"."gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."contract_type" AS ENUM ('CDI', 'CDD', 'FREELANCE', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "public"."employee_status" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."payment_method" AS ENUM ('BANK_TRANSFER', 'CHECK', 'CASH');

-- CreateEnum
CREATE TYPE "public"."attendance_status" AS ENUM ('PRESENT', 'ABSENT_JUSTIFIED', 'ABSENT_UNJUSTIFIED', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "public"."payroll_status" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "public"."absence_type" AS ENUM ('JUSTIFIED', 'UNJUSTIFIED');

-- CreateEnum
CREATE TYPE "public"."document_category" AS ENUM ('LEGAL', 'FINANCIAL', 'HR', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."document_status" AS ENUM ('DRAFT', 'FINAL', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."secretariat_task_status" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "public"."opportunity_stage" AS ENUM ('QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "public"."interaction_type" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."crm_task_status" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "public"."crm_task_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."lead_status" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST');

-- CreateEnum
CREATE TYPE "public"."contract_status" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."equipment_status" AS ENUM ('OPERATIONAL', 'NEEDS_MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "public"."option_type" AS ENUM ('FORMATS', 'GRAMMAGES', 'PRINTSIDES', 'LAMINATIONS', 'SIZES', 'COLORS', 'MATERIALS', 'DIMENSIONS', 'BINDINGS', 'FOLDINGS', 'CORNERS', 'EYELETS', 'PAGES', 'HANDLES', 'STUD', 'NUMBERING');

-- CreateEnum
CREATE TYPE "public"."sale_status" AS ENUM ('PAID', 'PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."option_key" AS ENUM ('FORMAT', 'GRAMMAGE', 'PRINTSIDE', 'LAMINATION', 'SIZE', 'COLOR', 'MATERIAL', 'DIMENSION', 'BINDING', 'FOLDING', 'CORNER', 'EYELET', 'PAGE', 'HANDLE', 'STUD', 'NUMBERING');

-- CreateEnum
CREATE TYPE "public"."order_source" AS ENUM ('MANUAL', 'WEB_ORDER', 'QUOTE_REQUEST');

-- CreateEnum
CREATE TYPE "public"."opportunity_source" AS ENUM ('MANUAL', 'WEB_ORDER', 'QUOTE_REQUEST');

-- CreateEnum
CREATE TYPE "public"."change_type" AS ENUM ('INCREASE', 'DECREASE');

-- CreateEnum
CREATE TYPE "public"."leave_type" AS ENUM ('ANNUAL', 'SICK', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."transaction_type" AS ENUM ('RECETTE', 'DEPENSE');

-- CreateEnum
CREATE TYPE "public"."transaction_status" AS ENUM ('VALIDE', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "public"."debt_status" AS ENUM ('A_PAYER', 'PAYER', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "public"."document_type" AS ENUM ('CONTRACT', 'ID_CARD', 'WORK_PERMIT', 'DIPLOMA');

-- CreateTable
CREATE TABLE "public"."subsidiaries" (
    "id" TEXT NOT NULL,
    "subsidiary_name" VARCHAR(255) NOT NULL,
    "logo_svg" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "ifu" VARCHAR(255) NOT NULL,
    "rccm" VARCHAR(255) NOT NULL,
    "bank_name" VARCHAR(255) NOT NULL,
    "account_number" VARCHAR(255) NOT NULL,
    "swift_code" VARCHAR(255) NOT NULL,
    "share_capital" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "subsidiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "user_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "user_role" "public"."user_role" NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."configurable_option_item" (
    "id" SERIAL NOT NULL,
    "option_name" VARCHAR(150) NOT NULL,
    "multiplier" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "configurable_option_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "main_category" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "stock" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "selling_price" DECIMAL(15,2) NOT NULL,
    "warehouse" VARCHAR(255) NOT NULL,
    "product_range" VARCHAR(255),
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."configurable_options" (
    "id" SERIAL NOT NULL,
    "option_type" "public"."option_type" NOT NULL,
    "product_id" TEXT,
    "item_id" INTEGER,

    CONSTRAINT "configurable_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_image" (
    "id" SERIAL NOT NULL,
    "image_url" TEXT NOT NULL,
    "product_id" TEXT,

    CONSTRAINT "product_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "gender" "public"."gender" NOT NULL,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "nationality" VARCHAR(50) NOT NULL,
    "social_security_number" VARCHAR(50) NOT NULL,
    "positions" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "hire_date" TIMESTAMP(3) NOT NULL,
    "contract_type" "public"."contract_type" NOT NULL,
    "status" "public"."employee_status" NOT NULL,
    "work_location" VARCHAR(100) NOT NULL,
    "base_salary" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bonus" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "benefits" TEXT[],
    "last_salary_adjustment_date" TIMESTAMP(3),
    "payment_method" "public"."payment_method" NOT NULL,
    "leave_balance" DECIMAL(5,2) DEFAULT 0,
    "subsidiary_id" TEXT NOT NULL,
    "managerId" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_documents" (
    "id" SERIAL NOT NULL,
    "doc_type" "public"."document_type" NOT NULL,
    "document_name" VARCHAR(255) NOT NULL,
    "url" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_position_history" (
    "id" SERIAL NOT NULL,
    "employee_position" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "employee_id" TEXT NOT NULL,

    CONSTRAINT "employee_position_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_trainings" (
    "id" SERIAL NOT NULL,
    "training_name" VARCHAR(255) NOT NULL,
    "training_date" TIMESTAMP(3) NOT NULL,
    "provider" VARCHAR(255),
    "employee_id" TEXT NOT NULL,

    CONSTRAINT "employee_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_performance_reviews" (
    "id" SERIAL NOT NULL,
    "review_date" TIMESTAMP(3) NOT NULL,
    "reviewer" VARCHAR(255),
    "rating" INTEGER,
    "review_comments" TEXT,
    "employee_id" TEXT NOT NULL,

    CONSTRAINT "employee_performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_leave_records" (
    "id" SERIAL NOT NULL,
    "leave_record_type" "public"."leave_type" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "employee_id" TEXT NOT NULL,

    CONSTRAINT "employee_leave_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "account_name" VARCHAR(255) NOT NULL,
    "industry" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "sales_rep_id" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contacts" (
    "id" TEXT NOT NULL,
    "contact_name" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "since" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "public"."contact_status",
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "account_id" TEXT,
    "sales_rep_id" TEXT,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sale" (
    "id" TEXT NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_price" DECIMAL(15,2) NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_name" VARCHAR(255) NOT NULL,
    "status" "public"."sale_status" NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "sales_rep_id" TEXT,

    CONSTRAINT "sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_rates" (
    "id" TEXT NOT NULL,
    "tax_rates_name" VARCHAR(255) NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."opportunities" (
    "id" TEXT NOT NULL,
    "opportunity_name" VARCHAR(255) NOT NULL,
    "opportunity_value" DECIMAL(15,2) NOT NULL,
    "stage" "public"."opportunity_stage" NOT NULL,
    "close_date" TIMESTAMP(3) NOT NULL,
    "source_opportunity" "public"."opportunity_source",
    "contact_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."opportunity_products" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "opportunity_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_name" VARCHAR(255) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_rate_value" DECIMAL(5,2) NOT NULL,
    "status" "public"."order_status" NOT NULL,
    "production_status" "public"."production_status" NOT NULL,
    "payment_status" "public"."payment_status" NOT NULL,
    "amount_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_due_date" TIMESTAMP(3) NOT NULL,
    "source" "public"."order_source" NOT NULL,
    "customer_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "tax_rate_id" TEXT NOT NULL,
    "sales_rep_id" TEXT,
    "opportunity_id" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_production_history" (
    "id" SERIAL NOT NULL,
    "status" "public"."production_status" NOT NULL,
    "change_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_id" TEXT NOT NULL,

    CONSTRAINT "order_production_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_item" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "design_file_name" VARCHAR(255),
    "design_file_url" TEXT NOT NULL,
    "product_id" TEXT,
    "order_id" TEXT,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_option" (
    "id" SERIAL NOT NULL,
    "option_type" TEXT NOT NULL,
    "option_value" VARCHAR(150) NOT NULL,
    "order_item_id" TEXT,

    CONSTRAINT "product_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kpi" (
    "id" SERIAL NOT NULL,
    "title_key" VARCHAR(100) NOT NULL,
    "kpi_value" VARCHAR(50) NOT NULL,
    "change" VARCHAR(50) NOT NULL,
    "change_type" "public"."change_type" NOT NULL,

    CONSTRAINT "kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."suppliers" (
    "id" TEXT NOT NULL,
    "supplier_name" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_orders" (
    "id" TEXT NOT NULL,
    "supplier_name" VARCHAR(255) NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,
    "expected_delivery_date" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "status" "public"."purchase_order_status" NOT NULL,
    "payment_terms" "public"."payment_terms" NOT NULL,
    "payment_status" "public"."payment_status" NOT NULL,
    "amount_paid" DECIMAL(15,2) NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_items" (
    "id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantity_received" INTEGER NOT NULL,
    "purchase_price" DECIMAL(15,2) NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_history" (
    "id" SERIAL NOT NULL,
    "event_name" VARCHAR(255) NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchase_order_id" TEXT NOT NULL,

    CONSTRAINT "purchase_order_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_account" (
    "id" TEXT NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "last_payment_date" TIMESTAMP(3) NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "credit_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."treasury_accounts" (
    "id" TEXT NOT NULL,
    "account_name" VARCHAR(255) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "treasury_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."financial_transactions" (
    "id" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "financial_transaction_type" "public"."transaction_type" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "account" VARCHAR(255) NOT NULL,
    "status" "public"."transaction_status" NOT NULL,
    "related_document_id" VARCHAR(50),
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company_documents" (
    "id" TEXT NOT NULL,
    "document_name" VARCHAR(255) NOT NULL,
    "category" "public"."document_category" NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."document_status" NOT NULL,
    "file_url" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meetings" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "meeting_date" TIMESTAMP(3) NOT NULL,
    "meeting_time" TIMESTAMP(3) NOT NULL,
    "meeting_location" VARCHAR(255),
    "agenda" TEXT,
    "minutes" TEXT,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."meeting_participants" (
    "id" SERIAL NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."secretariat_tasks" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."secretariat_task_status" NOT NULL,
    "assigned_to_id" TEXT,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "secretariat_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interactions" (
    "id" TEXT NOT NULL,
    "interaction_date" TIMESTAMP(3) NOT NULL,
    "type_interactions" "public"."interaction_type" NOT NULL,
    "notes" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."crm_tasks" (
    "id" VARCHAR(255) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."crm_task_status" NOT NULL,
    "priority" "public"."crm_task_priority" NOT NULL,
    "contactId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "lead_name" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "status" "public"."lead_status" NOT NULL,
    "description" TEXT,
    "salesRepId" TEXT,
    "subsidiaryId" TEXT NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."contract_status" NOT NULL,
    "client_id" TEXT NOT NULL,
    "subsidiaryId" TEXT NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fixed_assets" (
    "id" TEXT NOT NULL,
    "fixed_assets_name" VARCHAR(255) NOT NULL,
    "acquisition_date" TIMESTAMP(3) NOT NULL,
    "acquisition_cost" DECIMAL(15,2) NOT NULL,
    "depreciation_rate" DECIMAL(5,2) NOT NULL,
    "subsidiaryId" TEXT NOT NULL,

    CONSTRAINT "fixed_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."long_term_debts" (
    "id" TEXT NOT NULL,
    "debts_name" VARCHAR(255) NOT NULL,
    "initial_amount" DECIMAL(15,2) NOT NULL,
    "current_balance" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "maturity_date" TIMESTAMP(3) NOT NULL,
    "subsidiaryId" TEXT NOT NULL,

    CONSTRAINT "long_term_debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipment" (
    "id" TEXT NOT NULL,
    "equipment_name" VARCHAR(255) NOT NULL,
    "status" "public"."equipment_status" NOT NULL,
    "last_maintenance_date" TIMESTAMP(3) NOT NULL,
    "next_maintenance_date" TIMESTAMP(3) NOT NULL,
    "acquisition_date" TIMESTAMP(3) NOT NULL,
    "acquisition_value" DECIMAL(15,2) NOT NULL,
    "subsidiaryId" TEXT NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_records" (
    "id" TEXT NOT NULL,
    "maintenance_date" TIMESTAMP(3) NOT NULL,
    "technician" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "maintenance_cost" DECIMAL(10,2) NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subsidiaries_email_key" ON "public"."subsidiaries"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "public"."employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_key" ON "public"."contacts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participants_meeting_id_employee_id_key" ON "public"."meeting_participants"("meeting_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "public"."leads"("email");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."configurable_options" ADD CONSTRAINT "configurable_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."configurable_options" ADD CONSTRAINT "configurable_options_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."configurable_option_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_image" ADD CONSTRAINT "product_image_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contacts" ADD CONSTRAINT "contacts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale" ADD CONSTRAINT "sale_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale" ADD CONSTRAINT "sale_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sale" ADD CONSTRAINT "sale_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunities" ADD CONSTRAINT "opportunities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunities" ADD CONSTRAINT "opportunities_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunities" ADD CONSTRAINT "opportunities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunities" ADD CONSTRAINT "opportunities_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunity_products" ADD CONSTRAINT "opportunity_products_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."opportunity_products" ADD CONSTRAINT "opportunity_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_tax_rate_id_fkey" FOREIGN KEY ("tax_rate_id") REFERENCES "public"."tax_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_production_history" ADD CONSTRAINT "order_production_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_option" ADD CONSTRAINT "product_option_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."suppliers" ADD CONSTRAINT "suppliers_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_history" ADD CONSTRAINT "purchase_order_history_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_account" ADD CONSTRAINT "credit_account_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."treasury_accounts" ADD CONSTRAINT "treasury_accounts_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."financial_transactions" ADD CONSTRAINT "financial_transactions_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."company_documents" ADD CONSTRAINT "company_documents_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meetings" ADD CONSTRAINT "meetings_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."meeting_participants" ADD CONSTRAINT "meeting_participants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secretariat_tasks" ADD CONSTRAINT "secretariat_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secretariat_tasks" ADD CONSTRAINT "secretariat_tasks_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interactions" ADD CONSTRAINT "interactions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interactions" ADD CONSTRAINT "interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_tasks" ADD CONSTRAINT "crm_tasks_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_tasks" ADD CONSTRAINT "crm_tasks_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."crm_tasks" ADD CONSTRAINT "crm_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_subsidiaryId_fkey" FOREIGN KEY ("subsidiaryId") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_subsidiaryId_fkey" FOREIGN KEY ("subsidiaryId") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fixed_assets" ADD CONSTRAINT "fixed_assets_subsidiaryId_fkey" FOREIGN KEY ("subsidiaryId") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."long_term_debts" ADD CONSTRAINT "long_term_debts_subsidiaryId_fkey" FOREIGN KEY ("subsidiaryId") REFERENCES "public"."subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_subsidiaryId_fkey" FOREIGN KEY ("subsidiaryId") REFERENCES "public"."subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_records" ADD CONSTRAINT "maintenance_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
