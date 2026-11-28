-- Lot 1: Normalisation Cameroun (NIU, XAF), Gouvernance Multi-Filiales, Archivage & Audit Global

-- 1. Subsidiaries: rename ifu -> niu, add tax_center and tax_regime
ALTER TABLE "subsidiaries" RENAME COLUMN "ifu" TO "niu";
ALTER TABLE "subsidiaries" ADD COLUMN "tax_center" VARCHAR(150);
ALTER TABLE "subsidiaries" ADD COLUMN "tax_regime" VARCHAR(100);

-- 2. Users: active_subsidiary_id for explicit multi-subsidiary switching
ALTER TABLE "users" ADD COLUMN "active_subsidiary_id" TEXT;

-- 3. Non-destructive archiving on contacts & suppliers
ALTER TABLE "contacts" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "contacts" ADD COLUMN "archived_at" TIMESTAMP(3);
ALTER TABLE "contacts" ADD COLUMN "archived_by" TEXT;

ALTER TABLE "suppliers" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "suppliers" ADD COLUMN "archived_at" TIMESTAMP(3);
ALTER TABLE "suppliers" ADD COLUMN "archived_by" TEXT;

-- 4. Currency normalization XOF -> XAF (FCFA)
ALTER TABLE "PrefinancementAccount" ALTER COLUMN "currency" SET DEFAULT 'XAF';
UPDATE "PrefinancementAccount" SET "currency" = 'XAF' WHERE "currency" = 'XOF';
UPDATE "treasury_accounts" SET "currency" = 'XAF' WHERE "currency" = 'XOF';

-- 5. Multi-subsidiary access table
CREATE TABLE "user_subsidiary_accesses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subsidiary_id" TEXT NOT NULL,
    "granted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_subsidiary_accesses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_subsidiary_accesses_user_id_subsidiary_id_key" ON "user_subsidiary_accesses"("user_id", "subsidiary_id");
CREATE INDEX "user_subsidiary_accesses_subsidiary_id_idx" ON "user_subsidiary_accesses"("subsidiary_id");

ALTER TABLE "user_subsidiary_accesses" ADD CONSTRAINT "user_subsidiary_accesses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_subsidiary_accesses" ADD CONSTRAINT "user_subsidiary_accesses_subsidiary_id_fkey"
    FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Subsidiary transfer history
CREATE TABLE "subsidiary_transfer_histories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "employee_id" TEXT,
    "from_subsidiary_id" TEXT NOT NULL,
    "to_subsidiary_id" TEXT NOT NULL,
    "reason" TEXT,
    "transferred_by" TEXT,
    "transferred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subsidiary_transfer_histories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subsidiary_transfer_histories_user_id_transferred_at_idx" ON "subsidiary_transfer_histories"("user_id", "transferred_at");
CREATE INDEX "subsidiary_transfer_histories_employee_id_transferred_at_idx" ON "subsidiary_transfer_histories"("employee_id", "transferred_at");

ALTER TABLE "subsidiary_transfer_histories" ADD CONSTRAINT "subsidiary_transfer_histories_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. System-wide business audit log
CREATE TABLE "system_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_email" TEXT,
    "actor_role" TEXT,
    "subsidiary_id" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" VARCHAR(100),
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "system_audit_logs_subsidiary_id_created_at_idx" ON "system_audit_logs"("subsidiary_id", "created_at");
CREATE INDEX "system_audit_logs_actor_id_created_at_idx" ON "system_audit_logs"("actor_id", "created_at");
CREATE INDEX "system_audit_logs_entity_type_entity_id_idx" ON "system_audit_logs"("entity_type", "entity_id");
CREATE INDEX "system_audit_logs_action_idx" ON "system_audit_logs"("action");
