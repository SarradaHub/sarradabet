-- Allow multiple tickets on the same outcome (parimutuel pool betting).
DROP INDEX IF EXISTS "votes_user_id_oddId_key";

CREATE INDEX IF NOT EXISTS "votes_user_id_oddId_idx" ON "votes"("user_id", "oddId");
