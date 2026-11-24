-- CreateEnum
CREATE TYPE "public"."SalaryInputMode" AS ENUM ('BASE', 'NET');

-- AlterTable
ALTER TABLE "public"."employees" ADD COLUMN     "salary_input_mode" "public"."SalaryInputMode" NOT NULL DEFAULT 'BASE',
ADD COLUMN     "target_net_salary" DECIMAL(15,2);
