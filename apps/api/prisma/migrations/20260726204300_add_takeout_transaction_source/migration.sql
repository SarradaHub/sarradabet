-- Add TAKEOUT source for house revenue on bet resolution
ALTER TYPE "CoinTransactionSource" ADD VALUE IF NOT EXISTS 'TAKEOUT';
