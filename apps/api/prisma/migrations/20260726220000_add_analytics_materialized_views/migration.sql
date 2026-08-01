-- Materialized views for admin analytics (Feature 05)

CREATE MATERIALIZED VIEW daily_bet_stats AS
SELECT
  date_trunc('day', b.created_at) AS day,
  b."categoryId" AS category_id,
  COUNT(DISTINCT b.id)::bigint AS bet_count,
  COALESCE(SUM(v.amount), 0)::bigint AS coin_volume
FROM bets b
LEFT JOIN odd o ON o."betId" = b.id
LEFT JOIN votes v ON v."oddId" = o.id
GROUP BY date_trunc('day', b.created_at), b."categoryId";

CREATE UNIQUE INDEX daily_bet_stats_day_category_id_idx
  ON daily_bet_stats (day, category_id);

CREATE MATERIALIZED VIEW daily_pix_revenue AS
SELECT
  date_trunc('day', paid_at) AS day,
  SUM(amount_cents)::bigint AS revenue_cents,
  COUNT(*)::bigint AS payment_count
FROM pix_payments
WHERE status = 'APPROVED' AND paid_at IS NOT NULL
GROUP BY date_trunc('day', paid_at);

CREATE UNIQUE INDEX daily_pix_revenue_day_idx ON daily_pix_revenue (day);
