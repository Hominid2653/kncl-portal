# Quickstart — Run the Backend Locally

## Prerequisites

- Python 3.11+
- PostgreSQL (or Supabase database URL)
- Supabase project (Auth + optional Storage)

---

## Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then fill in values
```

### Required `.env` values

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (document uploads) |
| `SUPABASE_JWT_SECRET` | JWT secret (legacy HS256 projects) |
| `SECRET_KEY` | App secret (any random string for dev) |

See `backend/.env.example` for optional settings (Lichess, Chess.com, rate limits).

---

## Database

```bash
cd backend
alembic upgrade head
python -m app.seed.run          # seed if empty
python -m app.seed.run --reset  # wipe seed tables and reseed
```

---

## Run the server

```bash
cd backend
uvicorn app.main:app --reload
```

| URL | Description |
|-----|-------------|
| http://127.0.0.1:8000 | API root |
| http://127.0.0.1:8000/docs | Swagger UI |
| http://127.0.0.1:8000/redoc | ReDoc |
| http://127.0.0.1:8000/api/v1/health | Health check |
| http://127.0.0.1:8000/api/v1/health/db | Database health |

---

## Verify auth

With the server running:

```bash
# Real Supabase login
python -m app.auth.check --email you@example.com --password your-password

# Dev mock headers (no JWT)
python -m app.auth.check --mock
```

---

## Run tests

```bash
cd backend
pytest tests/ -q
```

---

## CORS (frontend on a different port)

CORS is configured via `CORS_ORIGINS` (comma-separated) in backend `.env`.

Default local:

```
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

For production, set this on Render to your deployed frontend URL. See [render.md](./render.md).
