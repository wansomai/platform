#!/usr/bin/env bash
# setup.sh — Run once on the Digital Ocean droplet as root.
# Sets up Python virtualenv, systemd service, and nginx proxy.
#
# Usage:
#   1. Copy the lii-scraper/ folder to the droplet:
#        scp -r lii-scraper/ root@<DROPLET_PUBLIC_IP>:/opt/lii-scraper
#
#   2. SSH in and run:
#        chmod +x /opt/lii-scraper/setup.sh
#        /opt/lii-scraper/setup.sh
#
#   3. Edit the env file and add your API key:
#        nano /opt/lii-scraper/.env
#
#   4. Restart the service:
#        systemctl restart lii-scraper

set -euo pipefail

APP_DIR="/opt/lii-scraper"
LOG_DIR="/var/log/lii-scraper"
SERVICE_USER="lii"

echo "==> Installing system packages..."
apt-get update -q
apt-get install -y -q python3 python3-pip python3-venv nginx

echo "==> Creating service user '${SERVICE_USER}'..."
id -u "${SERVICE_USER}" &>/dev/null || useradd --system --no-create-home "${SERVICE_USER}"

echo "==> Setting up log directory..."
mkdir -p "${LOG_DIR}"
chown "${SERVICE_USER}:${SERVICE_USER}" "${LOG_DIR}"

echo "==> Creating Python virtualenv..."
python3 -m venv "${APP_DIR}/venv"

echo "==> Installing Python dependencies..."
"${APP_DIR}/venv/bin/pip" install --upgrade pip -q
"${APP_DIR}/venv/bin/pip" install -r "${APP_DIR}/requirements.txt" -q

echo "==> Setting up .env file..."
if [ ! -f "${APP_DIR}/.env" ]; then
    cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
    echo ""
    echo "  !! IMPORTANT: Edit ${APP_DIR}/.env and set LII_API_KEY to a strong secret."
    echo "     Run: nano ${APP_DIR}/.env"
    echo ""
fi

echo "==> Setting file ownership..."
chown -R "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}"

echo "==> Installing systemd service..."
cp "${APP_DIR}/lii-scraper.service" /etc/systemd/system/lii-scraper.service
systemctl daemon-reload
systemctl enable lii-scraper

echo "==> Configuring nginx..."
cp "${APP_DIR}/nginx.conf" /etc/nginx/sites-available/lii-scraper
ln -sf /etc/nginx/sites-available/lii-scraper /etc/nginx/sites-enabled/lii-scraper
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Configuring firewall (UFW)..."
ufw allow OpenSSH
ufw allow 80/tcp
# Block everything else by default
ufw --force enable

echo ""
echo "==> Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set your API key:    nano ${APP_DIR}/.env"
echo "  2. Start the service:   systemctl start lii-scraper"
echo "  3. Check status:        systemctl status lii-scraper"
echo "  4. Check logs:          journalctl -u lii-scraper -f"
echo "  5. Test health:         curl http://localhost/health"
echo ""
echo "Your service will be available at:"
echo "  http://<DROPLET_PUBLIC_IP>/search"
echo ""
echo "Set these in Vercel / .env.local:"
echo "  LII_SCRAPER_URL=http://<DROPLET_PUBLIC_IP>"
echo "  LII_SCRAPER_API_KEY=<the value you set in /opt/lii-scraper/.env>"
