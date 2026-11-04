-- AlterTable
ALTER TABLE "public"."contacts" ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."newsletters" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletters_email_key" ON "public"."newsletters"("email");
