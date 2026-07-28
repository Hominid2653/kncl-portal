# KNCL Transfer Portal Backend

## Overview

The backend is built using **FastAPI**.

It exposes REST APIs used by the React frontend and communicates with the Supabase PostgreSQL database.

---

## Technologies

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Supabase
- Pydantic
- Uvicorn

---

## Folder Structure

app/
│
├── api/
├── models/
├── schemas/
├── services/
├── core/
├── database/
├── middleware/
├── utils/
└── main.py

---

## Responsibilities

The backend team is responsible for:

- Authentication
- Authorization
- User Management
- Player Management
- Club Management
- Transfer Workflow
- Notifications
- File Uploads
- External API Integration
- Analytics APIs

---

## API Modules

Authentication

```
/auth
```

Players

```
/players
```

Clubs

```
/clubs
```

Transfers

```
/transfers
```

Documents

```
/documents
```

Notifications

```
/notifications
```

Dashboard

```
/dashboard
```

---

## Database
## Database

The backend uses SQLAlchemy to communicate with a PostgreSQL database hosted on Supabase.

Authentication is managed by Supabase Auth.

### Authentication Flow

```
React
     │
     ▼
Supabase Auth
     │
JWT
     │
     ▼
FastAPI
     │
SQLAlchemy
     │
     ▼
Supabase PostgreSQL
```

The backend never stores passwords.

Supabase manages:

- Login
- Password hashing
- Password reset
- Email verification
- JWT generation

The application stores only user profile information inside the database.


Supabase PostgreSQL

## Main Tables

- user_profiles
- players
- clubs
- seasons
- registrations
- transfers
- transfer_approvals
- documents
- notifications
- audit_logs


---

## External APIs

### Chess.com

- `GET /integrations/chesscom/users/{username}` — verify username and fetch ratings/profile
- `GET /players/{id}/chesscom` — compare stored vs live ratings
- `POST /players/{id}/chesscom/sync` — sync ratings into player record
- `GET/POST /players/{id}/chesscom/verify` — name-match verification
- `POST /players/{id}/chesscom/verify/admin` — club admin attestation

### Lichess

- `GET /integrations/lichess/users/{username}` — verify username and fetch ratings/profile
- `GET /players/{id}/lichess` — compare stored vs live ratings (with drift)
- `POST /players/{id}/lichess/sync` — sync ratings into player record
- `GET/POST /players/{id}/lichess/verify` — bio code verification
- `POST /players/{id}/lichess/verify/admin` — club admin attestation

PATCH `/players/{id}` validates usernames against live APIs and supports `?sync_lichess=true` / `?sync_chesscom=true`.

External lookups are cached (10 min) and rate-limited (30 req/min per user).

---

## Running the Project

Install dependencies

```bash
pip install -r requirements.txt
```

Run server

```bash
uvicorn app.main:app --reload
```

Swagger

```
http://localhost:8000/docs
```

ReDoc

```
http://localhost:8000/redoc
```

---

## Database Seeding

Populate the database with KNCL reference data (league, clubs, players, registrations, transfers, etc.).

From the `backend/` directory:

```bash
# Seed only if empty
python -m app.seed.run

# Clear seed tables and reseed
python -m app.seed.run --reset
```

Seed data uses fixed UUIDs so IDs stay consistent across environments. See `app/seed/data.py` for reference IDs.

---

## Authentication

The API accepts Supabase access tokens via:

```
Authorization: Bearer <supabase_access_token>
```

The backend verifies Supabase access tokens and loads the matching `user_profiles` row from the `sub` claim.

**Verification modes:**

| Project type | Config | Algorithm |
|--------------|--------|-----------|
| Legacy | `SUPABASE_JWT_SECRET` | HS256 |
| Newer (default) | `SUPABASE_URL` (JWKS auto-fetched) | ES256 / RS256 |

At least one of `SUPABASE_URL` or `SUPABASE_JWT_SECRET` must be set. Real login tokens from newer Supabase projects are verified via JWKS at `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`. Legacy HS256 tokens still work when `SUPABASE_JWT_SECRET` is configured.

Add to `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your_legacy_jwt_secret   # optional for older projects
```

In development/test, mock headers remain available when `AUTH_MOCK_ENABLED=true`:

```
X-Mock-Role: FEDERATION_ADMIN
X-Mock-User-ID: <user_profiles.id>
X-Mock-Email: admin@kncl.local
```

Run tests:

```bash
pytest tests/ -q
```

Automated auth smoke test (server must be running):

```bash
# Uses seeded user + locally generated JWT
python -m app.auth.check

# Uses mock headers instead of JWT
python -m app.auth.check --mock

# Uses a real Supabase login
python -m app.auth.check --email you@example.com --password your-password
```

---

## Authorization

Role-based access control is enforced on every endpoint via `AuthorizationService`.

| Role | Capabilities |
|------|--------------|
| `FEDERATION_ADMIN` | Full access; creates leagues, seasons, clubs, audit logs |
| `LEAGUE_COORDINATOR` | Read all scoped resources; manage registrations, transfers, approvals |
| `CLUB_ADMIN` | Manage own club(s), members, registrations, transfers, documents |
| `PLAYER` | Read/update own profile, player record, notifications |

List endpoints automatically scope results by role. Single-resource GET endpoints call `ensure_can_read_*` checks after fetch.

Authorization tests: `pytest tests/test_authorization.py -q`

---

## Coding Standards

- Use Pydantic schemas
- Separate routers from business logic
- Keep endpoints RESTful
- Validate all incoming data
- Document endpoints
- Write reusable services

---

## Git Workflow

Create feature branches.

Examples

```
backend/authentication
backend/player-module
backend/transfers
```

Never push directly to main.

---

## Team Members

Backend Lead

- Elias

Backend Developer

- Purity