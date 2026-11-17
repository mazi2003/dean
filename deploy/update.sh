#!/usr/bin/env bash
# Zero-downtime-ish update script: pull latest code, rebuild, migrate, and verify health
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo "==> Pulling latest repository changes..."
git pull --ff-only

echo "==> Rebuilding and restarting containers..."
docker compose up -d --build

echo "==> Running post-deploy healthcheck..."
sleep 6
bash "$APP_DIR/deploy/healthcheck.sh"
