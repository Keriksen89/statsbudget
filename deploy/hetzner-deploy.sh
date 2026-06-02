#!/usr/bin/env bash
# deploy/hetzner-deploy.sh — deploy statsbudget.dk to Hetzner
#
# First-time setup: run deploy/finalize.mjs (sets up SSH key)
# Ongoing deploys:  bash deploy/hetzner-deploy.sh
#
# The SSH key is at deploy/id_statsbudget (never committed to git)

set -euo pipefail

HOST="${HETZNER_HOST:-root@91.99.193.181}"
KEY="$(dirname "$0")/id_statsbudget"
APP_DIR="/var/www/statsbudget"
SERVICE="statsbudget"

SSH_OPTS="-i $KEY -o StrictHostKeyChecking=no"

echo "==> Deploying to $HOST"
ssh $SSH_OPTS "$HOST" "
  cd $APP_DIR &&
  git fetch origin main &&
  git reset --hard origin/main &&
  npm ci --omit=dev
"

echo "==> Uploading data files"
scp $SSH_OPTS server/data/promises.json         "$HOST:$APP_DIR/server/data/promises.json"
scp $SSH_OPTS server/data/promise-keywords.json "$HOST:$APP_DIR/server/data/promise-keywords.json"

echo "==> Restarting service"
ssh $SSH_OPTS "$HOST" "systemctl restart $SERVICE && sleep 3 && systemctl is-active $SERVICE"

echo "==> Health check"
ssh $SSH_OPTS "$HOST" "curl -sf http://127.0.0.1:3000/api/health"

echo "==> Done!"
