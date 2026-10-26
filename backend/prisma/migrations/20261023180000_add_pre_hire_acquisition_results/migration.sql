ALTER TABLE "pre_hire_trainings"
ADD COLUMN "acquired_clients" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "acquired_prospects" INTEGER NOT NULL DEFAULT 0;
