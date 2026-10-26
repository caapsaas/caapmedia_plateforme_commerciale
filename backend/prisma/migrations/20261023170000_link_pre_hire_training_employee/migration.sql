ALTER TABLE "pre_hire_trainings"
ADD COLUMN "employee_id" TEXT;

CREATE UNIQUE INDEX "pre_hire_trainings_employee_id_key"
ON "pre_hire_trainings"("employee_id");

ALTER TABLE "pre_hire_trainings"
ADD CONSTRAINT "pre_hire_trainings_employee_id_fkey"
FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
