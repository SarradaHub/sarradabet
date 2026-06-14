#!/usr/bin/env bash
set -euo pipefail

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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(find_repo_root "$SCRIPT_DIR")"
PLATFORM_DIR="$(dirname "$REPO_ROOT")/platform"
DESIGN_SYSTEM_DIR="$PLATFORM_DIR/design-system"

if [ -f "$DESIGN_SYSTEM_DIR/package.json" ]; then
  echo "platform/design-system already present at $DESIGN_SYSTEM_DIR"
  exit 0
fi

echo "Cloning SarradaHub/platform into $PLATFORM_DIR..."
git clone --depth 1 https://github.com/SarradaHub/platform.git "$PLATFORM_DIR"
