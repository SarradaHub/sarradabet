ALTER TABLE "bets"
ADD COLUMN "external_match_id" TEXT,
ADD COLUMN "metadata" JSONB;

CREATE UNIQUE INDEX "Bet_externalMatchId_key"
ON "bets" ("external_match_id");
