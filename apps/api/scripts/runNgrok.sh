#!/usr/bin/env bash
set -euo pipefail

resolve_ngrok() {
  if command -v ngrok >/dev/null 2>&1; then
    command -v ngrok
    return 0
  fi

  for candidate in /snap/bin/ngrok /usr/local/bin/ngrok /usr/bin/ngrok; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

has_ngrok_authtoken() {
  if [[ -n "${NGROK_AUTHTOKEN:-}" ]]; then
    return 0
  fi

  local config_file="${HOME}/.config/ngrok/ngrok.yml"
  local legacy_config="${HOME}/.ngrok2/ngrok.yml"

  if [[ -f "$config_file" ]] && grep -q "authtoken:" "$config_file"; then
    return 0
  fi

  if [[ -f "$legacy_config" ]] && grep -q "authtoken:" "$legacy_config"; then
    return 0
  fi

  return 1
}

NGROK_BIN="$(resolve_ngrok || true)"

if [[ -z "$NGROK_BIN" ]]; then
  echo "ngrok not found."
  echo ""
  echo "Install options:"
  echo "  sudo snap install ngrok"
  echo "  export PATH=\"/snap/bin:\$PATH\"   # if snap says command is in /snap/bin"
  echo "  See docs/LOCAL_WEBHOOKS.md for apt install"
  exit 1
fi

if ! has_ngrok_authtoken; then
  echo "ngrok is not authenticated yet."
  echo ""
  echo "1. Create a free account: https://dashboard.ngrok.com/signup"
  echo "2. Copy your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "3. Run once:"
  echo "   ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN"
  echo ""
  echo "Or set NGROK_AUTHTOKEN in apps/api/.env.local and rerun:"
  echo "   NGROK_AUTHTOKEN=... npm run webhook:tunnel"
  exit 1
fi

PORT="${PORT:-8000}"
echo "Starting ngrok on port ${PORT} using ${NGROK_BIN}"
exec "$NGROK_BIN" http "$PORT"
