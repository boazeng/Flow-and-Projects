"""Flow and Projects — FastAPI backend.

Three jobs:
1. Google sign-in + roles, via the shared-auth package (gates the whole app).
2. A central SQLite store that mirrors the browser's localStorage, so the data
   is shared across devices/browsers instead of living only in one browser.
3. Serves the built React SPA (dist/), behind the auth middleware.

The state store is deliberately a key/value mirror of localStorage: each
localStorage key becomes a row, the value is the raw string the browser stored
(JSON text for objects/arrays). This keeps the migration tiny — the existing
backup file maps 1:1 to rows.
"""
import base64
import json
import os
import sqlite3
from contextlib import closing
from pathlib import Path

from dotenv import load_dotenv

# ── env resolution (mirrors the bank-discrepancies pattern) ──
PROJECT_ROOT = Path(__file__).resolve().parent.parent
_override = os.getenv("FLOW_ENV_FILE")                 # set explicitly in prod
_shared = PROJECT_ROOT.parent / "env" / ".env"        # central folder (local dev)
_local = PROJECT_ROOT / ".env"                         # fallback
if _override and Path(_override).exists():
    _env_path = Path(_override)
elif _shared.exists():
    _env_path = _shared
else:
    _env_path = _local
load_dotenv(_env_path, override=True)

import httpx  # noqa: E402
from fastapi import FastAPI, Request, Depends, HTTPException  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

from shared_auth import install_auth, require_login  # noqa: E402

DIST_DIR = PROJECT_ROOT / "dist"

# ── Priority ERP ──
_PRIORITY_URL      = os.getenv("PRIORITY_URL_REAL", "").rstrip("/")
_PRIORITY_USERNAME = os.getenv("PRIORITY_USERNAME", "")
_PRIORITY_PASSWORD = os.getenv("PRIORITY_PASSWORD", "")

# CASHNAME in Priority → internal key used in cashflow-bank-balances
_PRIORITY_CASHNAME_MAP = {
    "109-200": "חניה_פועלים",
    "026-201": "אחזקה_דיסקונט",
    "026-200": "אחזקה_מזרחי",
    "110-201": "אנרגיה_פועלים",
}
DATA_DIR = Path(os.getenv("FLOW_DATA_DIR", str(PROJECT_ROOT / "database")))
DATA_DIR.mkdir(parents=True, exist_ok=True)
STATE_DB = str(DATA_DIR / "flow.db")


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(STATE_DB)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    with closing(_conn()) as c:
        c.execute("PRAGMA journal_mode=WAL")  # concurrent reads while writing
        c.execute(
            """CREATE TABLE IF NOT EXISTS app_state (
                   key        TEXT PRIMARY KEY,
                   value      TEXT NOT NULL,
                   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
               )"""
        )
        c.commit()


_init_db()

app = FastAPI(title="Flow and Projects", docs_url=None, redoc_url=None)

# Google sign-in + roles. Gates every route except the auth/public paths.
install_auth(
    app,
    db_path=str(DATA_DIR / "auth.db"),
    redirect_uri=os.getenv("AUTH_REDIRECT_URI", "https://flow.newavera.co.il/auth/callback"),
    initial_users=[{"email": "boazen@gmail.com", "role": "admin"}],
)


# ───────────────── central state store (mirrors localStorage) ─────────────────
@app.get("/api/state")
def get_state(_user=Depends(require_login)):
    """All stored keys → their raw string values."""
    with closing(_conn()) as c:
        rows = c.execute("SELECT key, value FROM app_state").fetchall()
    return {r["key"]: r["value"] for r in rows}


@app.put("/api/state/{key}")
async def put_state(key: str, request: Request, _user=Depends(require_login)):
    """Upsert one key. Body: {"value": "<raw localStorage string>"}."""
    body = await request.json()
    value = body.get("value")
    if not isinstance(value, str):
        raise HTTPException(400, "value חייב להיות מחרוזת")
    with closing(_conn()) as c:
        c.execute(
            """INSERT INTO app_state (key, value, updated_at)
                   VALUES (?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(key) DO UPDATE
                   SET value = excluded.value, updated_at = CURRENT_TIMESTAMP""",
            (key, value),
        )
        c.commit()
    return {"ok": True}


@app.delete("/api/state/{key}")
def delete_state(key: str, _user=Depends(require_login)):
    with closing(_conn()) as c:
        c.execute("DELETE FROM app_state WHERE key = ?", (key,))
        c.commit()
    return {"ok": True}


# ───────────────── server-to-server: bank balance push from tact-bankaccount ─────────────────
@app.put("/api/bank-balances-push")
async def push_bank_balances(request: Request):
    """Receives bank balances from tact-bankaccount and merges into cashflow-bank-balances."""
    expected_key = os.getenv("FLOW_PUSH_API_KEY", "")
    if not expected_key:
        raise HTTPException(503, "FLOW_PUSH_API_KEY not configured on server")
    if request.headers.get("Authorization", "") != f"Bearer {expected_key}":
        raise HTTPException(401, "Unauthorized")
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(400, "Expected JSON object")
    with closing(_conn()) as c:
        row = c.execute("SELECT value FROM app_state WHERE key = 'cashflow-bank-balances'").fetchone()
        existing = json.loads(row["value"]) if row else {}
        existing.update(body)
        c.execute(
            """INSERT INTO app_state (key, value, updated_at)
                   VALUES (?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(key) DO UPDATE
                   SET value = excluded.value, updated_at = CURRENT_TIMESTAMP""",
            ("cashflow-bank-balances", json.dumps(existing, ensure_ascii=False)),
        )
        c.commit()
    return {"ok": True, "updated": list(body.keys())}


# ───────────────── Priority bank balances ─────────────────
@app.get("/api/bank-balances")
async def get_bank_balances_from_priority(_user=Depends(require_login)):
    """Fetch latest closing balance per account from Priority BANKPAGES."""
    if not _PRIORITY_URL or not _PRIORITY_USERNAME:
        raise HTTPException(503, "Priority not configured (PRIORITY_URL_REAL / PRIORITY_USERNAME missing)")

    cashnames = list(_PRIORITY_CASHNAME_MAP.keys())
    filter_str = " or ".join(f"CASHNAME eq '{n}'" for n in cashnames)
    auth_header = "Basic " + base64.b64encode(f"{_PRIORITY_USERNAME}:{_PRIORITY_PASSWORD}".encode()).decode()

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{_PRIORITY_URL}/BANKPAGES",
            headers={"Authorization": auth_header, "Accept": "application/json"},
            params={
                "$filter": filter_str,
                "$select": "CASHNAME,CLOSEBAL,CURDATE",
                "$orderby": "CURDATE desc",
                "$top": "200",
            },
        )
    if not r.is_success:
        raise HTTPException(502, f"Priority error {r.status_code}: {r.text[:200]}")

    rows = r.json().get("value", [])

    # Keep only the most-recent page per CASHNAME (list is already sorted desc)
    latest: dict = {}
    for row in rows:
        if row["CASHNAME"] not in latest:
            latest[row["CASHNAME"]] = row

    balances: dict = {}
    dates: list = []
    for cashname, row in latest.items():
        key = _PRIORITY_CASHNAME_MAP.get(cashname)
        if key:
            balances[key] = row["CLOSEBAL"]
            if row.get("CURDATE"):
                dates.append(row["CURDATE"][:10])

    return {"balances": balances, "as_of": max(dates) if dates else None}


# ───────────────── serve the built SPA (behind the auth middleware) ─────────────────
if (DIST_DIR / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def spa(full_path: str, _user=Depends(require_login)):
    """Serve a real file if it exists, else index.html (client-side routing)."""
    candidate = DIST_DIR / full_path
    if full_path and candidate.is_file():
        return FileResponse(str(candidate))
    return FileResponse(str(DIST_DIR / "index.html"))
