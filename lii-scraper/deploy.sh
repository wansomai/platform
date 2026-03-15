#!/usr/bin/env bash
# deploy.sh — Re-deploy updated code to the droplet without full reinstall.
# Run from your local machine.
#
# Usage: ./lii-scraper/deploy.sh <DROPLET_PUBLIC_IP>

set -euo pipefail

DROPLET_IP="${1:?Usage: $0 <DROPLET_PUBLIC_IP>}"
APP_DIR="/opt/lii-scraper"
SERVICE_USER="lii"

echo "==> Syncing files to ${DROPLET_IP}:${APP_DIR}..."
rsync -avz --exclude '.env' --exclude '__pycache__' --exclude 'venv' \
    lii-scraper/ "root@${DROPLET_IP}:${APP_DIR}/"

echo "==> Installing any new dependencies..."
ssh "root@${DROPLET_IP}" "
    /opt/lii-scraper/venv/bin/pip install -r ${APP_DIR}/requirements.txt -q &&
    chown -R ${SERVICE_USER}:${SERVICE_USER} ${APP_DIR} &&
    systemctl restart lii-scraper &&
    systemctl status lii-scraper --no-pager
"

echo "==> Deploy complete. Testing health endpoint..."
sleep 2
curl -s "http://${DROPLET_IP}/health" | python3 -m json.tool
