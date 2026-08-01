#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/clone-platform.sh"

find_repo_root() {
  local dir="$1"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/turbo.json" ]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

REPO_ROOT="$(find_repo_root "$SCRIPT_DIR")"
DESIGN_SYSTEM_DIR="$(dirname "$REPO_ROOT")/platform/design-system"

if [ ! -f "$DESIGN_SYSTEM_DIR/package.json" ]; then
  echo "design-system not found at $DESIGN_SYSTEM_DIR" >&2
  exit 1
fi

cd "$DESIGN_SYSTEM_DIR"

if [ -e dist ] && [ ! -w dist ]; then
  backup="dist.unwritable.$(date +%s)"
  echo "dist/ not writable (likely root-owned) — moving to $backup"
  mv dist "$backup"
fi

npm ci --legacy-peer-deps
npm run build
