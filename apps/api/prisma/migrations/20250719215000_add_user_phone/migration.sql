-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" VARCHAR(20),
ADD COLUMN "coin_balance" INTEGER NOT NULL DEFAULT 0;

-- Backfill phone for existing users (placeholder unique values)
UPDATE "users" SET "phone" = '550000000' || LPAD(id::text, 4, '0') WHERE "phone" IS NULL;

ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
