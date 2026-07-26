-- Clear anonymous votes before adding required userId/amount
DELETE FROM "votes";

-- AlterEnum BetStatus: add scheduled
ALTER TYPE "BetStatus" ADD VALUE IF NOT EXISTS 'scheduled' BEFORE 'open';

-- AlterEnum CoinTransactionSource: add WIN
ALTER TYPE "CoinTransactionSource" ADD VALUE IF NOT EXISTS 'WIN';

-- CreateEnum VoteStatus
CREATE TYPE "VoteStatus" AS ENUM ('pending', 'paid', 'lost');

-- AlterTable bets
ALTER TABLE "bets" ADD COLUMN IF NOT EXISTS "start_time" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "closes_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "bets_start_time_idx" ON "bets"("start_time");
CREATE INDEX IF NOT EXISTS "bets_closes_at_idx" ON "bets"("closes_at");

-- AlterTable votes
ALTER TABLE "votes" ADD COLUMN IF NOT EXISTS "user_id" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "status" "VoteStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "payout_amount" INTEGER,
ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);

ALTER TABLE "votes" ALTER COLUMN "user_id" DROP DEFAULT;
ALTER TABLE "votes" ALTER COLUMN "amount" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "votes_user_id_idx" ON "votes"("user_id");
CREATE INDEX IF NOT EXISTS "votes_status_idx" ON "votes"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "votes_user_id_oddId_key" ON "votes"("user_id", "oddId");

ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
