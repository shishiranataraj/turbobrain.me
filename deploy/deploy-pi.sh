#!/bin/bash
# Bare-metal deploy/update script for the Raspberry Pi.
# Idempotent: safe to run on first install or for updates.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "==> Pulling latest"
git pull --ff-only

echo "==> Python venv"
if [ ! -d venv ]; then
  python3 -m venv venv
fi
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r backend/requirements.txt

echo "==> Frontend build"
cd frontend
npm install --no-audit --no-fund
npm run build
cd "$DIR"

echo "==> Restart service"
if systemctl list-unit-files | grep -q '^turbobrain\.service'; then
  sudo systemctl restart turbobrain
  sudo systemctl status turbobrain --no-pager --lines=5
else
  echo "turbobrain.service not installed yet — see deploy/PI-SETUP.md"
fi

echo "==> Done"
