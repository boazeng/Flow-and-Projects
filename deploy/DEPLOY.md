# Deploying Flow and Projects to the Mac mini

A Docker container (OrbStack) on a unique local port, exposed through the shared
**Cloudflare Tunnel**. Follows `~/server/readme_load_server.md` /
`MAC-MINI-APP-INSTALL.md`.

Unlike the original static version, the app now has a **FastAPI backend**:
- **Google sign-in** (shared-auth) gates the whole app — financial data is no
  longer open on a public URL.
- A **central SQLite store** (`flow.db`) mirrors the browser's localStorage, so
  data is shared across devices/browsers instead of living in one browser.
- FastAPI also serves the built React SPA.

## Allocation

| Param | Value |
|-------|-------|
| Repo | github.com/boazeng/Flow-and-Projects |
| Folder | `~/server/flow` |
| **Port** | **8093** (container listens on 8000) |
| Subdomain | `flow.newavera.co.il` |
| Container | `flow` |
| Data | `~/server/flow/database/flow.db` + `auth.db` (volume) |
| Secrets | `~/server/flow/.env` (Google OAuth + session secret, chmod 600) |

## Secrets — `.env` (never in git)

| Key | What |
|-----|------|
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client |
| `AUTH_SESSION_SECRET` | random — `openssl rand -hex 32` |
| `AUTH_EMERGENCY_TOKEN` | optional bypass token |
| `AUTH_SUPER_ADMIN_EMAIL` | `boazen@gmail.com` |
| `AUTH_REDIRECT_URI` | `https://flow.newavera.co.il/auth/callback` |

⚠️ In Google Cloud Console, add `https://flow.newavera.co.il/auth/callback` to the
OAuth client's **Authorized redirect URIs** before first login.

## Deploy steps (run ON the Mac)

```bash
cd ~/server
git clone https://github.com/boazeng/Flow-and-Projects.git flow
cd flow

# secrets (fill in the Google client id/secret + a random session secret)
cp .env.example .env && chmod 600 .env && nano .env

~/.orbstack/bin/docker compose up -d --build
curl -s -o /dev/null -w "local=%{http_code}\n" http://127.0.0.1:8093/   # 307/302 -> /login (auth working)
```

## Cloudflare Tunnel + DNS

1. `~/.cloudflared/config.yml` — add ABOVE the catch-all 404:
   ```yaml
     - hostname: flow.newavera.co.il
       service: http://localhost:8093
   ```
   `/opt/homebrew/bin/cloudflared tunnel ingress validate`
2. `sudo launchctl stop com.cloudflare.cloudflared && sudo launchctl start com.cloudflare.cloudflared`
3. Cloudflare dashboard: delete any old `flow` record, then add
   **CNAME** `flow` → `ae8d8404-c382-475e-a31d-ad5ee34387e1.cfargotunnel.com`, Proxied 🟠.

## Import the existing data (one-time)

After logging in, open the app → **⬆ שחזור נתונים** → pick the backup JSON. The
restore writes to localStorage, which the sync layer pushes to `flow.db` — so it
becomes the shared central copy for every device.

## Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://flow.newavera.co.il/   # 302 -> Google login
~/.orbstack/bin/docker logs flow --since 30s
```

## Update after a code change

```bash
cd ~/server/flow && git pull --ff-only && ~/.orbstack/bin/docker compose up -d --build
```
(The `database/` volume — your data — survives rebuilds.)
