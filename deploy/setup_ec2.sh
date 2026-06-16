#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────
# EC2 setup for Flow and Projects — a STATIC Vite/React site.
#
# Co-hosts on the SAME EC2 box as bank-discrepancies and supplierinvoice.
# It is the lightest of the three: no backend, no gunicorn, no systemd service,
# no dedicated port. nginx just serves the built files from /var/www.
#
# Run ONCE on the instance (Amazon Linux 2023 or Ubuntu):
#   git clone https://github.com/boazeng/Flow-and-Projects.git ~/Flow-and-Projects
#   bash ~/Flow-and-Projects/deploy/setup_ec2.sh
# Idempotent — safe to re-run.
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="https://github.com/boazeng/Flow-and-Projects.git"
APP_USER="${SUDO_USER:-$(whoami)}"
HOME_DIR="$(getent passwd "$APP_USER" | cut -d: -f6)"
APP_DIR="$HOME_DIR/Flow-and-Projects"
DOMAIN="flow.newavera.co.il"
WEBROOT="/var/www/$DOMAIN"

echo "== Flow and Projects EC2 setup =="
echo "user=$APP_USER  app_dir=$APP_DIR  webroot=$WEBROOT"

# 1. System packages (git + nginx + Node 20). Vite 5 needs Node 18+.
if command -v dnf &>/dev/null; then
    sudo dnf install -y git nginx nodejs   # AL2023 ships nodejs 18/20
elif command -v apt &>/dev/null; then
    sudo apt update -y
    sudo apt install -y git nginx
    if ! command -v node &>/dev/null || [ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 18 ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
else
    echo "Unsupported OS (need dnf or apt)" >&2; exit 1
fi
echo "-- node $(node -v), npm $(npm -v)"

# 2. Clone or update the repo
if [ -d "$APP_DIR/.git" ]; then
    echo "-- repo exists, pulling latest"
    git -C "$APP_DIR" pull --ff-only
else
    git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

# 3. Build the static site
npm ci
npm run build
[ -d dist ] || { echo "!! build produced no dist/ — aborting" >&2; exit 1; }

# 4. Publish the build to the webroot (world-readable, no home-dir perm issues)
sudo mkdir -p "$WEBROOT"
sudo rsync -a --delete dist/ "$WEBROOT/"
echo "-- published build to $WEBROOT"

# 5. nginx static server block (HTTP-only seed — certbot adds HTTPS later)
sudo cp deploy/nginx-flow.conf /etc/nginx/conf.d/zz-flow.conf
echo "-- copied nginx config to /etc/nginx/conf.d/zz-flow.conf"

cat <<EOF

== Setup done. Final steps ==
1. Test + reload nginx:  sudo nginx -t && sudo systemctl reload nginx
2. (TLS) issue cert:     sudo certbot --nginx -d $DOMAIN
3. Reload again:         sudo systemctl reload nginx
4. Cloudflare DNS:       A record  name=flow  -> EC2 public IP  (Proxied / orange cloud)

Visit: https://$DOMAIN
EOF
