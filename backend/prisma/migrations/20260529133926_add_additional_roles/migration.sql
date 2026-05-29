-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "additional_roles" "public"."UserRole"[] DEFAULT ARRAY[]::"public"."UserRole"[];
