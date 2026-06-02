#!/usr/bin/env bash
# deploy/hetzner-deploy.sh
# One-command deploy from local machine to Hetzner server.
# Usage: HETZNER_HOST=user@your-server-ip bash deploy/hetzner-deploy.sh

set -euo pipefail

HOST="${HETZNER_HOST:?Set HETZNER_HOST=user@ip}"
APP_DIR="/var/www/statsbudget"
SERVICE="statsbudget"

echo "==> Syncing code to $HOST:$APP_DIR"
rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude 'server/data/*.db' \
  --exclude 'server/data/votes.json' \
  --exclude '.env' \
  ./ "${HOST}:${APP_DIR}/"

echo "==> Installing dependencies"
ssh "$HOST" "cd $APP_DIR && npm ci --omit=dev"

echo "==> Restarting service"
ssh "$HOST" "sudo systemctl restart $SERVICE && sudo systemctl status $SERVICE --no-pager -l"

echo "==> Health check"
sleep 3
ssh "$HOST" "curl -sf http://127.0.0.1:3000/api/health && echo ' OK'"

echo "==> Done! statsbudget.dk is live."
