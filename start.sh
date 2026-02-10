#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

# Load env vars
if [ -f "$DIR/.env" ]; then
  export $(grep -v '^#' "$DIR/.env" | xargs)
fi

# Activate venv
source "$DIR/venv/bin/activate"

# Start gunicorn
cd "$DIR/backend"
exec gunicorn "app:create_app()" -c "$DIR/deploy/gunicorn.conf.py"
