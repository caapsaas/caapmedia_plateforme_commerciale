CREATE TYPE "PreHireTrainingStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'HIRED', 'NOT_RETAINED', 'CANCELLED');

CREATE TABLE "pre_hire_trainings" (
    "id" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150),
    "phone" VARCHAR(30) NOT NULL,
    "target_position" VARCHAR(150) NOT NULL,
    "department" VARCHAR(100),
    "mentor_name" VARCHAR(200),
    "start_date" DATE NOT NULL,
    "planned_end_date" DATE,
    "status" "PreHireTrainingStatus" NOT NULL DEFAULT 'PLANNED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "evaluation" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "subsidiary_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pre_hire_trainings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pre_hire_trainings_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "pre_hire_trainings_subsidiary_id_status_idx" ON "pre_hire_trainings"("subsidiary_id", "status");
CREATE INDEX "pre_hire_trainings_subsidiary_id_last_name_first_name_idx" ON "pre_hire_trainings"("subsidiary_id", "last_name", "first_name");
