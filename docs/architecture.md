# System Architecture

## Overview

The KNCL Transfer Portal follows a modern three-tier architecture.

```
                    React Frontend
                           │
                     Axios / HTTP
                           │
                           ▼
                    FastAPI Backend
                           │
             SQLAlchemy ORM + Pydantic
                           │
                           ▼
               Supabase PostgreSQL
                           │
          ┌────────────────┴───────────────┐
          │                                │
  Supabase Authentication         Supabase Storage
          │                                │
          └────────────────┬───────────────┘
                           │
          Chess.com API    │    Lichess API
```

---

## Frontend

- React
- React Router
- Tailwind CSS
- Axios

---

## Backend

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic

---

## Database

- PostgreSQL
- Supabase

---

## Authentication

Supabase Authentication using JWT.

---

## File Storage

Supabase Storage.

---

## External APIs

- Chess.com Public API
- Lichess API