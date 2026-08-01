-- AlterEnum
ALTER TYPE "CoinTransactionSource" ADD VALUE 'REWARD_REDEMPTION';

-- CreateTable
CREATE TABLE "user_stats" (
    "user_id" INTEGER NOT NULL,
    "total_bets" INTEGER NOT NULL DEFAULT 0,
    "won_bets" INTEGER NOT NULL DEFAULT 0,
    "lost_bets" INTEGER NOT NULL DEFAULT 0,
    "win_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ranking_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "coin_cost" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_redemptions" (
    "id" SERIAL NOT NULL,
    "reward_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "ticket_code" VARCHAR(36) NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated_at" TIMESTAMP(3),
    "validated_by" INTEGER,

    CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_stats_ranking_score_idx" ON "user_stats"("ranking_score" DESC);

-- CreateIndex
CREATE INDEX "rewards_is_active_idx" ON "rewards"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "reward_redemptions_ticket_code_key" ON "reward_redemptions"("ticket_code");

-- CreateIndex
CREATE INDEX "reward_redemptions_user_id_idx" ON "reward_redemptions"("user_id");

-- CreateIndex
CREATE INDEX "reward_redemptions_reward_id_idx" ON "reward_redemptions"("reward_id");

-- AddForeignKey
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
