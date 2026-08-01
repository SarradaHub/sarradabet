#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT/apps/api"
ENV_FILE="$API_DIR/.env.production.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

cd "$API_DIR"

echo "Inspecting production schema..."
npx tsx scripts/inspect-prod-schema.ts

echo
echo "Resetting incorrect migration history..."
npx tsx scripts/reset-prod-migration-history.ts

BASELINE_MIGRATIONS=(
  20250318194330_supabase_extensions
  20250319140447_supabase_extensions
  20250319141559_
  20250319141936_
  20250319151621_
  20250614000000_add_bet_performance_indexes
)

echo
echo "Marking ${#BASELINE_MIGRATIONS[@]} migrations as already applied..."
for migration in "${BASELINE_MIGRATIONS[@]}"; do
  echo "==> $migration"
  npx prisma migrate resolve --applied "$migration"
done

echo
echo "Applying pending migrations..."
npm run prisma:migrate:deploy

echo
echo "Done."
