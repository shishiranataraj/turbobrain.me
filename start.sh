#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

# Load env vars
if [ -f "$DIR/.env" ]; then
  export $(grep -v '^#' "$DIR/.env" | xargs)
fi

# Activate venv
source "$DIR/venv/bin/activate"

# Start gunicorn in background
cd "$DIR/backend"
gunicorn "app:create_app()" -c "$DIR/deploy/gunicorn.conf.py" &
GUNICORN_PID=$!

# Start cloudflare tunnel (named tunnel via TUNNEL_TOKEN from .env)
if [ -z "${TUNNEL_TOKEN:-}" ]; then
  echo "ERROR: TUNNEL_TOKEN not set in .env" >&2
  exit 1
fi
cloudflared tunnel --protocol http2 --no-autoupdate run --token "$TUNNEL_TOKEN" &
TUNNEL_PID=$!

# Clean up both on exit
trap "kill $GUNICORN_PID $TUNNEL_PID 2>/dev/null" EXIT

echo "Gunicorn running on :8000, cloudflare tunnel starting..."
wait
