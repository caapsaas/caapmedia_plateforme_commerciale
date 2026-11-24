CREATE TABLE "integration_checks" (
    "id" SERIAL NOT NULL,
    "service_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "diagnostic" TEXT,
    "duration_ms" INTEGER,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "integration_checks_service_id_checked_at_id_idx"
    ON "integration_checks"("service_id", "checked_at" DESC, "id" DESC);
CREATE INDEX "integration_checks_checked_at_idx"
    ON "integration_checks"("checked_at");
