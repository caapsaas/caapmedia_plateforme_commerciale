/*
  Warnings:

  - The `status` column on the `contacts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `source_opportunity` column on the `opportunities` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type_absence` on the `absence_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `attendance_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `company_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `company_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `option_type` on the `configurable_options` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `contracts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `crm_tasks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `priority` on the `crm_tasks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `doc_type` on the `employee_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `leave_record_type` on the `employee_leave_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `gender` on the `employees` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `contract_type` on the `employees` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `employees` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payment_method` on the `employees` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `equipment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `expense_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `expense_record_type` on the `expense_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `financial_transaction_type` on the `financial_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `financial_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type_interactions` on the `interactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `change_type` on the `kpi` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `leads` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `stage` on the `opportunities` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `order_production_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `production_status` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payment_status` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `source` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `payroll_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `purchase_orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payment_terms` on the `purchase_orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payment_status` on the `purchase_orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `sale` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `secretariat_tasks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `supplier_debts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'COMMERCIAL', 'CAISSIER', 'PURCHASING_MANAGER', 'FINANCIAL_DIRECTOR', 'SECRETARY', 'HR_MANAGER', 'PRODUCTION_DIRECTOR');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING_VALIDATION', 'NEW', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "public"."ProductionStatus" AS ENUM ('PREPRESS', 'PRINTING', 'FINISHING', 'READY_FOR_DELIVERY');

-- CreateEnum
CREATE TYPE "public"."ContactStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."PurchaseOrderStatus" AS ENUM ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentTerms" AS ENUM ('IMMEDIATE', 'CREDIT', 'DRAFT_PAYMENT');

-- CreateEnum
CREATE TYPE "public"."ExpenseCategory" AS ENUM ('RENT', 'SALARIES', 'ADVERTISING', 'TRANSPORT', 'SERVICES', 'INSURANCE', 'PURCHASE_COST', 'COMMISSIONS', 'PACKAGING', 'TRANSACTION_FEES', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExpenseType" AS ENUM ('FIXED', 'VARIABLE');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ContractType" AS ENUM ('CDI', 'CDD', 'FREELANCE', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "public"."EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CHECK', 'CASH');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT_JUSTIFIED', 'ABSENT_UNJUSTIFIED', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "public"."PayrollStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "public"."AbsenceType" AS ENUM ('JUSTIFIED', 'UNJUSTIFIED');

-- CreateEnum
CREATE TYPE "public"."DocumentCategory" AS ENUM ('LEGAL', 'FINANCIAL', 'HR', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('DRAFT', 'FINAL', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."SecretariatTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "public"."OpportunityStage" AS ENUM ('QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "public"."InteractionType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CrmTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "public"."CrmTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'LOST');

-- CreateEnum
CREATE TYPE "public"."ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EquipmentStatus" AS ENUM ('OPERATIONAL', 'NEEDS_MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "public"."OptionType" AS ENUM ('FORMATS', 'GRAMMAGES', 'PRINTSIDES', 'LAMINATIONS', 'SIZES', 'COLORS', 'MATERIALS', 'DIMENSIONS', 'BINDINGS', 'FOLDINGS', 'CORNERS', 'EYELETS', 'PAGES', 'HANDLES', 'STUD', 'NUMBERING');

-- CreateEnum
CREATE TYPE "public"."SaleStatus" AS ENUM ('PAID', 'PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OptionKey" AS ENUM ('FORMAT', 'GRAMMAGE', 'PRINTSIDE', 'LAMINATION', 'SIZE', 'COLOR', 'MATERIAL', 'DIMENSION', 'BINDING', 'FOLDING', 'CORNER', 'EYELET', 'PAGE', 'HANDLE', 'STUD', 'NUMBERING');

-- CreateEnum
CREATE TYPE "public"."OrderSource" AS ENUM ('MANUAL', 'WEB_ORDER', 'QUOTE_REQUEST');

-- CreateEnum
CREATE TYPE "public"."OpportunitySource" AS ENUM ('MANUAL', 'WEB_ORDER', 'QUOTE_REQUEST');

-- CreateEnum
CREATE TYPE "public"."ChangeType" AS ENUM ('INCREASE', 'DECREASE');

-- CreateEnum
CREATE TYPE "public"."LeaveType" AS ENUM ('ANNUAL', 'SICK', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('RECETTE', 'DEPENSE');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('VALIDE', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "public"."DebtStatus" AS ENUM ('A_PAYER', 'PAYER', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('CONTRACT', 'ID_CARD', 'WORK_PERMIT', 'DIPLOMA');

-- AlterTable
ALTER TABLE "public"."absence_records" DROP COLUMN "type_absence",
ADD COLUMN     "type_absence" "public"."AbsenceType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."attendance_records" DROP COLUMN "status",
ADD COLUMN     "status" "public"."AttendanceStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."company_documents" DROP COLUMN "category",
ADD COLUMN     "category" "public"."DocumentCategory" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."DocumentStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."configurable_options" DROP COLUMN "option_type",
ADD COLUMN     "option_type" "public"."OptionType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."contacts" DROP COLUMN "status",
ADD COLUMN     "status" "public"."ContactStatus";

-- AlterTable
ALTER TABLE "public"."contracts" DROP COLUMN "status",
ADD COLUMN     "status" "public"."ContractStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."crm_tasks" DROP COLUMN "status",
ADD COLUMN     "status" "public"."CrmTaskStatus" NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" "public"."CrmTaskPriority" NOT NULL;

-- AlterTable
ALTER TABLE "public"."employee_documents" DROP COLUMN "doc_type",
ADD COLUMN     "doc_type" "public"."DocumentType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."employee_leave_records" DROP COLUMN "leave_record_type",
ADD COLUMN     "leave_record_type" "public"."LeaveType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."employees" DROP COLUMN "gender",
ADD COLUMN     "gender" "public"."Gender" NOT NULL,
DROP COLUMN "contract_type",
ADD COLUMN     "contract_type" "public"."ContractType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."EmployeeStatus" NOT NULL,
DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "public"."PaymentMethod" NOT NULL;

-- AlterTable
ALTER TABLE "public"."equipment" DROP COLUMN "status",
ADD COLUMN     "status" "public"."EquipmentStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."expense_records" DROP COLUMN "category",
ADD COLUMN     "category" "public"."ExpenseCategory" NOT NULL,
DROP COLUMN "expense_record_type",
ADD COLUMN     "expense_record_type" "public"."ExpenseType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."financial_transactions" DROP COLUMN "financial_transaction_type",
ADD COLUMN     "financial_transaction_type" "public"."TransactionType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."TransactionStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."interactions" DROP COLUMN "type_interactions",
ADD COLUMN     "type_interactions" "public"."InteractionType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."kpi" DROP COLUMN "change_type",
ADD COLUMN     "change_type" "public"."ChangeType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."leads" DROP COLUMN "status",
ADD COLUMN     "status" "public"."LeadStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."opportunities" DROP COLUMN "stage",
ADD COLUMN     "stage" "public"."OpportunityStage" NOT NULL,
DROP COLUMN "source_opportunity",
ADD COLUMN     "source_opportunity" "public"."OpportunitySource";

-- AlterTable
ALTER TABLE "public"."order_production_history" DROP COLUMN "status",
ADD COLUMN     "status" "public"."ProductionStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "status",
ADD COLUMN     "status" "public"."OrderStatus" NOT NULL,
DROP COLUMN "production_status",
ADD COLUMN     "production_status" "public"."ProductionStatus" NOT NULL,
DROP COLUMN "payment_status",
ADD COLUMN     "payment_status" "public"."PaymentStatus" NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" "public"."OrderSource" NOT NULL;

-- AlterTable
ALTER TABLE "public"."payroll_records" DROP COLUMN "status",
ADD COLUMN     "status" "public"."PayrollStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."purchase_orders" DROP COLUMN "status",
ADD COLUMN     "status" "public"."PurchaseOrderStatus" NOT NULL,
DROP COLUMN "payment_terms",
ADD COLUMN     "payment_terms" "public"."PaymentTerms" NOT NULL,
DROP COLUMN "payment_status",
ADD COLUMN     "payment_status" "public"."PaymentStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."sale" DROP COLUMN "status",
ADD COLUMN     "status" "public"."SaleStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."secretariat_tasks" DROP COLUMN "status",
ADD COLUMN     "status" "public"."SecretariatTaskStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."supplier_debts" DROP COLUMN "status",
ADD COLUMN     "status" "public"."DebtStatus" NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "user_role",
ADD COLUMN     "user_role" "public"."UserRole" NOT NULL;

-- DropEnum
DROP TYPE "public"."absence_type";

-- DropEnum
DROP TYPE "public"."attendance_status";

-- DropEnum
DROP TYPE "public"."change_type";

-- DropEnum
DROP TYPE "public"."contact_status";

-- DropEnum
DROP TYPE "public"."contract_status";

-- DropEnum
DROP TYPE "public"."contract_type";

-- DropEnum
DROP TYPE "public"."crm_task_priority";

-- DropEnum
DROP TYPE "public"."crm_task_status";

-- DropEnum
DROP TYPE "public"."debt_status";

-- DropEnum
DROP TYPE "public"."document_category";

-- DropEnum
DROP TYPE "public"."document_status";

-- DropEnum
DROP TYPE "public"."document_type";

-- DropEnum
DROP TYPE "public"."employee_status";

-- DropEnum
DROP TYPE "public"."equipment_status";

-- DropEnum
DROP TYPE "public"."expense_category";

-- DropEnum
DROP TYPE "public"."expense_type";

-- DropEnum
DROP TYPE "public"."gender";

-- DropEnum
DROP TYPE "public"."interaction_type";

-- DropEnum
DROP TYPE "public"."lead_status";

-- DropEnum
DROP TYPE "public"."leave_type";

-- DropEnum
DROP TYPE "public"."opportunity_source";

-- DropEnum
DROP TYPE "public"."opportunity_stage";

-- DropEnum
DROP TYPE "public"."option_key";

-- DropEnum
DROP TYPE "public"."option_type";

-- DropEnum
DROP TYPE "public"."order_source";

-- DropEnum
DROP TYPE "public"."order_status";

-- DropEnum
DROP TYPE "public"."payment_method";

-- DropEnum
DROP TYPE "public"."payment_status";

-- DropEnum
DROP TYPE "public"."payment_terms";

-- DropEnum
DROP TYPE "public"."payroll_status";

-- DropEnum
DROP TYPE "public"."production_status";

-- DropEnum
DROP TYPE "public"."purchase_order_status";

-- DropEnum
DROP TYPE "public"."sale_status";

-- DropEnum
DROP TYPE "public"."secretariat_task_status";

-- DropEnum
DROP TYPE "public"."transaction_status";

-- DropEnum
DROP TYPE "public"."transaction_type";

-- DropEnum
DROP TYPE "public"."user_role";
