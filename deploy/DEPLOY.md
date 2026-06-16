# Deploying Flow and Projects to the Mac mini

Follows the proven pattern in `~/server/readme_load_server.md` and the runbook
`MAC-MINI-APP-INSTALL.md`: each app = a Docker container (OrbStack) on a unique
local port, exposed publicly through the shared **Cloudflare Tunnel**.

This app is the **simplest case — a static Vite/React site, no backend**. The
container is just nginx serving the build; there are **no secrets / no `.env`**.

## Allocation

| Param | Value |
|-------|-------|
| Repo | github.com/boazeng/Flow-and-Projects |
| Folder | `~/server/flow` |
| **Port** | **8093** (next free in the registry) |
| Subdomain | `flow.newavera.co.il` |
| Container | `flow` |
| State / secrets | none (static site) |

## Files in this repo for the Mac deploy

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage: node builds the site → nginx serves it. Self-contained. |
| `docker-compose.yml` | Maps `127.0.0.1:8093 -> :80`, `container_name: flow`. |
| `deploy/nginx-container.conf` | nginx config inside the container (SPA fallback). |
| `.dockerignore` | Keeps `.git`, `node_modules`, `dist` out of the build context. |

## Deploy steps (run ON the Mac — locally or via the Mac's Claude)

```bash
# 1. Clone and build
cd ~/server
git clone https://github.com/boazeng/Flow-and-Projects.git flow
cd flow
~/.orbstack/bin/docker compose up -d --build

# 2. Verify the container serves locally (expect 200)
curl -s -o /dev/null -w "local=%{http_code}\n" http://127.0.0.1:8093/

# 3. Add the tunnel ingress — edit ~/.cloudflared/config.yml,
#    add ABOVE the catch-all 404 service:
#      - hostname: flow.newavera.co.il
#        service: http://localhost:8093
/opt/homebrew/bin/cloudflared tunnel ingress validate

# 4. Restart the tunnel (needs sudo — must run on the Mac itself)
sudo launchctl stop com.cloudflare.cloudflared && sudo launchctl start com.cloudflare.cloudflared
```

## Cloudflare DNS (dashboard)

- If a record named `flow` already exists, **delete it** (Cloudflare can't change a record's Type).
- Add record: Type=`CNAME`, Name=`flow`,
  Target=`ae8d8404-c382-475e-a31d-ad5ee34387e1.cfargotunnel.com`, Proxy=🟠 Proxied.

## Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://flow.newavera.co.il/   # 200
~/.orbstack/bin/docker logs flow --since 20s                            # traffic hits this container
```

## Housekeeping

- Update the port registry (`8093 = flow`) and the "what's running" table in
  `~/server/readme_load_server.md`.

## Updating after a code change

```bash
cd ~/server/flow && git pull --ff-only && ~/.orbstack/bin/docker compose up -d --build
```
