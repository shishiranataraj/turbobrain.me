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

# Start cloudflare tunnel
cloudflared tunnel --url http://localhost:8000 &
TUNNEL_PID=$!

# Clean up both on exit
trap "kill $GUNICORN_PID $TUNNEL_PID 2>/dev/null" EXIT

echo "Gunicorn running on :8000, cloudflare tunnel starting..."
wait
