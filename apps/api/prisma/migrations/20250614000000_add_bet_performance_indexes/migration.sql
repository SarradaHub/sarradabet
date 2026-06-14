-- Add indexes for category filtering and status+created_at list queries
CREATE INDEX IF NOT EXISTS "bets_categoryId_idx" ON "bets"("categoryId");
CREATE INDEX IF NOT EXISTS "bets_status_created_at_idx" ON "bets"("status", "created_at" DESC);
