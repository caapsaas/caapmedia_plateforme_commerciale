-- CreateIndex
CREATE INDEX "absence_records_subsidiary_id_start_date_idx" ON "public"."absence_records"("subsidiary_id", "start_date");

-- CreateIndex
CREATE INDEX "absence_records_employee_id_idx" ON "public"."absence_records"("employee_id");

-- CreateIndex
CREATE INDEX "absence_records_type_absence_idx" ON "public"."absence_records"("type_absence");

-- CreateIndex
CREATE INDEX "accounts_subsidiary_id_sales_rep_id_account_name_idx" ON "public"."accounts"("subsidiary_id", "sales_rep_id", "account_name");

-- CreateIndex
CREATE INDEX "accounts_subsidiary_id_account_name_idx" ON "public"."accounts"("subsidiary_id", "account_name");

-- CreateIndex
CREATE INDEX "accounts_industry_idx" ON "public"."accounts"("industry");

-- CreateIndex
CREATE INDEX "attendance_records_subsidiary_id_attendance_date_idx" ON "public"."attendance_records"("subsidiary_id", "attendance_date");

-- CreateIndex
CREATE INDEX "attendance_records_employee_id_idx" ON "public"."attendance_records"("employee_id");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "public"."attendance_records"("status");

-- CreateIndex
CREATE INDEX "company_documents_subsidiary_id_upload_date_idx" ON "public"."company_documents"("subsidiary_id", "upload_date");

-- CreateIndex
CREATE INDEX "company_documents_category_idx" ON "public"."company_documents"("category");

-- CreateIndex
CREATE INDEX "company_documents_status_idx" ON "public"."company_documents"("status");

-- CreateIndex
CREATE INDEX "contacts_subsidiary_id_since_idx" ON "public"."contacts"("subsidiary_id", "since");

-- CreateIndex
CREATE INDEX "contacts_subsidiary_id_sales_rep_id_contact_name_idx" ON "public"."contacts"("subsidiary_id", "sales_rep_id", "contact_name");

-- CreateIndex
CREATE INDEX "contacts_subsidiary_id_contact_name_idx" ON "public"."contacts"("subsidiary_id", "contact_name");

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "public"."contacts"("status");

-- CreateIndex
CREATE INDEX "contacts_account_id_idx" ON "public"."contacts"("account_id");

-- CreateIndex
CREATE INDEX "employees_subsidiary_id_last_name_idx" ON "public"."employees"("subsidiary_id", "last_name");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "public"."employees"("status");

-- CreateIndex
CREATE INDEX "employees_department_idx" ON "public"."employees"("department");

-- CreateIndex
CREATE INDEX "expense_records_subsidiary_id_expense_date_idx" ON "public"."expense_records"("subsidiary_id", "expense_date");

-- CreateIndex
CREATE INDEX "expense_records_category_idx" ON "public"."expense_records"("category");

-- CreateIndex
CREATE INDEX "expense_records_expense_record_type_idx" ON "public"."expense_records"("expense_record_type");

-- CreateIndex
CREATE INDEX "financial_transactions_subsidiary_id_transaction_date_idx" ON "public"."financial_transactions"("subsidiary_id", "transaction_date");

-- CreateIndex
CREATE INDEX "financial_transactions_financial_transaction_type_idx" ON "public"."financial_transactions"("financial_transaction_type");

-- CreateIndex
CREATE INDEX "financial_transactions_status_idx" ON "public"."financial_transactions"("status");

-- CreateIndex
CREATE INDEX "financial_transactions_treasury_account_id_idx" ON "public"."financial_transactions"("treasury_account_id");

-- CreateIndex
CREATE INDEX "fixed_assets_subsidiary_id_acquisition_date_idx" ON "public"."fixed_assets"("subsidiary_id", "acquisition_date");

-- CreateIndex
CREATE INDEX "leads_subsidiary_id_lead_name_idx" ON "public"."leads"("subsidiary_id", "lead_name");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "public"."leads"("status");

-- CreateIndex
CREATE INDEX "leads_sales_rep_id_idx" ON "public"."leads"("sales_rep_id");

-- CreateIndex
CREATE INDEX "long_term_debts_subsidiary_id_maturity_date_idx" ON "public"."long_term_debts"("subsidiary_id", "maturity_date");

-- CreateIndex
CREATE INDEX "meetings_subsidiary_id_meeting_date_idx" ON "public"."meetings"("subsidiary_id", "meeting_date");

-- CreateIndex
CREATE INDEX "payroll_records_subsidiary_id_payroll_period_idx" ON "public"."payroll_records"("subsidiary_id", "payroll_period");

-- CreateIndex
CREATE INDEX "payroll_records_employee_id_idx" ON "public"."payroll_records"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_records_status_idx" ON "public"."payroll_records"("status");

-- CreateIndex
CREATE INDEX "products_subsidiary_id_stock_idx" ON "public"."products"("subsidiary_id", "stock");

-- CreateIndex
CREATE INDEX "purchase_order_items_product_id_idx" ON "public"."purchase_order_items"("product_id");

-- CreateIndex
CREATE INDEX "sale_subsidiary_id_status_sale_date_idx" ON "public"."sale"("subsidiary_id", "status", "sale_date");

-- CreateIndex
CREATE INDEX "secretariat_tasks_subsidiary_id_due_date_idx" ON "public"."secretariat_tasks"("subsidiary_id", "due_date");

-- CreateIndex
CREATE INDEX "secretariat_tasks_status_idx" ON "public"."secretariat_tasks"("status");

-- CreateIndex
CREATE INDEX "secretariat_tasks_assigned_to_id_idx" ON "public"."secretariat_tasks"("assigned_to_id");

-- CreateIndex
CREATE INDEX "subsidiaries_subsidiary_name_idx" ON "public"."subsidiaries"("subsidiary_name");

-- CreateIndex
CREATE INDEX "supplier_debts_subsidiary_id_due_date_idx" ON "public"."supplier_debts"("subsidiary_id", "due_date");

-- CreateIndex
CREATE INDEX "supplier_debts_status_idx" ON "public"."supplier_debts"("status");

-- CreateIndex
CREATE INDEX "treasury_accounts_subsidiary_id_account_name_idx" ON "public"."treasury_accounts"("subsidiary_id", "account_name");
