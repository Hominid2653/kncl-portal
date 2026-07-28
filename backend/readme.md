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

- Verify username
- Fetch rating
- Fetch profile

### Lichess

- Verify username
- Fetch rating
- Fetch profile

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

The backend verifies the JWT using `SUPABASE_JWT_SECRET`, reads the `sub` claim as the Supabase auth user ID, and loads the matching `user_profiles` row for application role and permissions.

Add to `.env`:

```
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
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