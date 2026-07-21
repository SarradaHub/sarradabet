-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(20),
ADD COLUMN "coin_balance" INTEGER NOT NULL DEFAULT 0;

-- Backfill phone for existing users (placeholder unique values)
UPDATE "users" SET "phone" = '550000000' || LPAD(id::text, 4, '0') WHERE "phone" IS NULL;

ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "CoinTransactionSource" AS ENUM ('PIX_PURCHASE', 'BET_COST', 'ADMIN_ADJUSTMENT', 'REFUND');
CREATE TYPE "PixPaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "coin_packages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "coins_amount" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coin_transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "source" "CoinTransactionSource" NOT NULL,
    "reference_id" INTEGER,
    "external_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pix_payments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "coin_package_id" INTEGER NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "coins_amount" INTEGER NOT NULL,
    "status" "PixPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "external_id" TEXT NOT NULL,
    "qr_code" TEXT,
    "qr_code_base64" TEXT,
    "ticket_url" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pix_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coin_packages_is_active_sort_order_idx" ON "coin_packages"("is_active", "sort_order");
CREATE INDEX "coin_transactions_user_id_created_at_idx" ON "coin_transactions"("user_id", "created_at");
CREATE UNIQUE INDEX "coin_transactions_external_id_key" ON "coin_transactions"("external_id");
CREATE UNIQUE INDEX "pix_payments_external_id_key" ON "pix_payments"("external_id");
CREATE UNIQUE INDEX "pix_payments_idempotency_key_key" ON "pix_payments"("idempotency_key");
CREATE INDEX "pix_payments_user_id_status_idx" ON "pix_payments"("user_id", "status");
CREATE INDEX "pix_payments_expires_at_idx" ON "pix_payments"("expires_at");

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pix_payments" ADD CONSTRAINT "pix_payments_coin_package_id_fkey" FOREIGN KEY ("coin_package_id") REFERENCES "coin_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default coin package
INSERT INTO "coin_packages" ("name", "amount_cents", "coins_amount", "is_active", "sort_order", "updated_at")
VALUES ('Pacote Básico', 500, 100, true, 0, CURRENT_TIMESTAMP);
