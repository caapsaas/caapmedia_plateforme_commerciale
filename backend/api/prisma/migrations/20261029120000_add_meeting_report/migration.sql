-- Keep existing meetings and their written minutes unchanged.
ALTER TABLE "meetings"
ADD COLUMN "completed_at" TIMESTAMP(3),
ADD COLUMN "minutes_file_url" TEXT,
ADD COLUMN "minutes_file_name" TEXT;
