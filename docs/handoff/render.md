# Deploy to Render

Deploy the FastAPI backend as a **Web Service** on [Render](https://render.com) so the frontend team can call a stable HTTPS URL.

---

## What’s included in the repo

| File | Purpose |
|------|---------|
| `render.yaml` | Render Blueprint (infra-as-code) |
| `backend/start.sh` | Runs migrations, then starts Uvicorn |
| `backend/requirements.txt` | Python dependencies |

On each deploy, Render runs:

1. `pip install -r requirements.txt`
2. `alembic upgrade head`
3. `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Health check: `GET /api/v1/health`

---

## Prerequisites

1. GitHub repo pushed (Render deploys from Git)
2. **Supabase** project with:
   - Database URL (use **Session pooler** or **Transaction pooler** connection string)
   - Auth keys (`SUPABASE_URL`, anon key, service role key, JWT secret)
   - Storage bucket `documents` (for file uploads)
3. [Render](https://render.com) account (free tier works for dev)

---

## Option A — Blueprint deploy (recommended)

1. Push this repo to GitHub
2. In Render: **New → Blueprint**
3. Connect the repository — Render reads `render.yaml` at the repo root
4. Set **secret** environment variables when prompted:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (anon key)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
5. Click **Apply**

Render generates `SECRET_KEY` automatically. `APP_ENV=production` and `AUTH_MOCK_ENABLED=false` are set in the blueprint.

---

## Option B — Manual Web Service

1. **New → Web Service** → connect GitHub repo
2. Settings:

| Setting | Value |
|---------|--------|
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `bash start.sh` |
| **Health Check Path** | `/api/v1/health` |

3. **Environment** variables (see table below)

---

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Supabase Postgres URI. Use pooler URL with `?sslmode=require` |
| `SUPABASE_URL` | Yes | `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | Yes | Supabase **anon** public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | For document uploads to Storage |
| `SUPABASE_JWT_SECRET` | Yes | JWT secret from Supabase API settings |
| `SECRET_KEY` | Yes | Random string (Render can auto-generate) |
| `APP_ENV` | Yes | `production` |
| `AUTH_MOCK_ENABLED` | Yes | `false` in production |
| `CORS_ORIGINS` | Yes | Comma-separated frontend URLs |
| `SUPABASE_STORAGE_BUCKET` | No | Default: `documents` |
| `PYTHON_VERSION` | No | `3.12.0` recommended |

### `DATABASE_URL` format

From Supabase → **Project Settings → Database → Connection string** (URI).

Use the **Transaction pooler** (port 6543) for serverless-friendly connections:

```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
```

The app normalizes this for async SQLAlchemy (`postgresql+psycopg://`).

### `CORS_ORIGINS`

Allow your frontend origin(s):

```
https://your-frontend.onrender.com,http://localhost:5173
```

Update when the frontend is deployed.

---

## After first deploy

1. **Verify health**
   ```
   https://<your-service>.onrender.com/api/v1/health
   https://<your-service>.onrender.com/api/v1/health/db
   ```

2. **Open Swagger**
   ```
   https://<your-service>.onrender.com/docs
   ```

3. **Seed data** (optional, one-time for demo/staging)

   Render shell or local machine with production `DATABASE_URL`:

   ```bash
   cd backend
   python -m app.seed.run
   ```

   Do **not** run `--reset` against production unless intentional.

4. **Share with frontend**

   ```env
   VITE_API_BASE_URL=https://<your-service>.onrender.com/api/v1
   ```

   Update `docs/handoff/README.md` base URL table if needed.

---

## Auth smoke test (production)

```bash
python -m app.auth.check \
  --base-url https://<your-service>.onrender.com \
  --email you@example.com \
  --password your-password
```

Mock headers are disabled when `AUTH_MOCK_ENABLED=false`.

---

## Free tier notes

- Service **spins down** after ~15 min idle → first request may take 30–60s (cold start)
- Upgrade to a paid plan for always-on staging/production

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check `PYTHON_VERSION=3.12.0`, `rootDir=backend` |
| DB connection error | Use pooler URL + `sslmode=require`; verify IP allowlist (Supabase allows all by default) |
| 401 on all routes | Set `SUPABASE_JWT_SECRET`; frontend must send real Supabase Bearer token |
| CORS errors | Add frontend URL to `CORS_ORIGINS` on Render, redeploy |
| Migrations fail | Check Render logs during start; run `alembic upgrade head` locally against same DB to debug |

Logs: Render dashboard → your service → **Logs**

---

## Redeploy

Push to the connected branch — Render auto-deploys if `autoDeploy: true` in `render.yaml`.

Manual: **Manual Deploy → Deploy latest commit**
