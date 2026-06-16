#!/bin/bash
# Pull the latest code, rebuild, and republish. Run on the EC2 box after pushing.
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="flow.newavera.co.il"
WEBROOT="/var/www/$DOMAIN"
cd "$APP_DIR"

echo "== Updating Flow and Projects =="
git pull --ff-only
npm ci
npm run build
sudo rsync -a --delete dist/ "$WEBROOT/"
sudo nginx -t && sudo systemctl reload nginx
echo "-- done. Published to $WEBROOT and reloaded nginx."
