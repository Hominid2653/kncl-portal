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

Supabase PostgreSQL

Main Tables

- Users
- Roles
- Players
- Clubs
- Club Memberships
- Transfers
- Documents
- Notifications
- Audit Logs

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