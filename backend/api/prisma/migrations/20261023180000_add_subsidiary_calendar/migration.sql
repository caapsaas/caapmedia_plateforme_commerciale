ALTER TABLE "subsidiaries"
ADD COLUMN "working_days" INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5];

CREATE TABLE "subsidiary_holidays" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "subsidiary_id" TEXT NOT NULL,

    CONSTRAINT "subsidiary_holidays_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subsidiary_holidays_subsidiary_id_date_key"
ON "subsidiary_holidays"("subsidiary_id", "date");

ALTER TABLE "subsidiary_holidays"
ADD CONSTRAINT "subsidiary_holidays_subsidiary_id_fkey"
FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id")
ON DELETE CASCADE ON UPDATE CASCADE;