# Deploying Flow and Projects to AWS

Same EC2 box as **bank-discrepancies** and **supplierinvoice**, but this is the
**simplest of the three**: a pure **static Vite/React site**. No backend, no
gunicorn, no systemd service, no dedicated port. **nginx** serves the built
files directly, TLS via Let's Encrypt behind **Cloudflare**.

## How the three sites coexist on one box

Each site is just its own nginx `server_name`. No port collisions.

| Site | Type | Internal port | nginx conf |
|------|------|---------------|------------|
| bookkeeping / supplierinvoice | Flask/gunicorn | 8000 | (existing) |
| bank-discrepancies | Flask/gunicorn | 5000 | `zz-bank.conf` |
| **flow** (this) | **static — nginx only** | **none** | `zz-flow.conf` |

## Architecture

Public URL: **https://flow.newavera.co.il**

```
Cloudflare ─▶ nginx :443 (flow.newavera.co.il) ─▶ static files in /var/www/flow.newavera.co.il
```

The build is published to `/var/www/flow.newavera.co.il` (world-readable, avoids
home-dir permission issues). `dist/` is gitignored, so the site is **built on the
box** — that's why Node is installed during setup.

## First-time setup (on the existing EC2 instance)

Ports 80/443 are already open (the sibling sites use them). SSH in, then:

```bash
git clone https://github.com/boazeng/Flow-and-Projects.git ~/Flow-and-Projects
bash ~/Flow-and-Projects/deploy/setup_ec2.sh
```

The script installs git + nginx + Node 20, builds the site, publishes it to
`/var/www/flow.newavera.co.il`, and installs the nginx config as
`/etc/nginx/conf.d/zz-flow.conf`. Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d flow.newavera.co.il   # issues TLS + adds the HTTPS block
sudo systemctl reload nginx
```

## Subdomain / DNS (Cloudflare)

- DNS record: type `A`, name `flow`, value = the EC2 public IP
  (same IP as `bank-discrepancies` / `bookkeeping`), **Proxied** (orange cloud).
- `server_name` in `deploy/nginx-flow.conf` is already `flow.newavera.co.il`.

## Updating after a code change

```bash
# locally: commit + push, then on the box:
bash ~/Flow-and-Projects/deploy/update.sh
```

It pulls, rebuilds, republishes to the webroot, and reloads nginx.

## Files in this folder

| File | Purpose |
|------|---------|
| `setup_ec2.sh` | One-time provisioning: installs Node/nginx, builds, publishes, installs nginx conf. |
| `nginx-flow.conf` | nginx static server block (SPA fallback) for the subdomain. |
| `update.sh` | git pull + rebuild + republish + reload nginx. |
