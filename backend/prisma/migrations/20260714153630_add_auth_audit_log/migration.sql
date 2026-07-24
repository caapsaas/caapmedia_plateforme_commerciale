-- CreateEnum
CREATE TYPE "public"."AuthAuditEvent" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_2FA_PENDING', 'LOGOUT', 'REFRESH_TOKEN_REUSE_DETECTED', 'TWO_FACTOR_ENABLED', 'TWO_FACTOR_DISABLED', 'TWO_FACTOR_LOGIN_SUCCESS', 'TWO_FACTOR_LOGIN_FAILED', 'PASSWORD_RESET_REQUESTED');

-- CreateTable
CREATE TABLE "public"."auth_audit_logs" (
    "id" UUID NOT NULL,
    "event" "public"."AuthAuditEvent" NOT NULL,
    "user_id" UUID,
    "email" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_audit_logs_user_id_idx" ON "public"."auth_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "auth_audit_logs_email_idx" ON "public"."auth_audit_logs"("email");

-- CreateIndex
CREATE INDEX "auth_audit_logs_event_idx" ON "public"."auth_audit_logs"("event");

-- CreateIndex
CREATE INDEX "auth_audit_logs_created_at_idx" ON "public"."auth_audit_logs"("created_at");
