# KNCL Transfer Portal Architecture

Version: 1.0
Status: Active

---

# Overview

The Kenya National Chess League (KNCL) Transfer Portal is a full-stack web application that digitizes player registration, club management, transfer requests, approvals, and league administration.

The platform replaces manual registration and transfer processes with a secure, scalable, and role-based digital system.

The backend exposes a REST API built with FastAPI.

The frontend consumes the API using React.

The database is PostgreSQL hosted on Supabase.

Authentication is provided through Supabase Auth.

---

# Goals

The system should:

- Register players
- Register clubs
- Manage league seasons
- Handle player registrations
- Process transfer requests
- Track approvals
- Store transfer documents
- Notify users
- Maintain a complete audit trail

The architecture must remain modular, maintainable, and easy to extend.

---

# Technology Stack

## Frontend

- React
- React Router
- Axios
- JavaScript
- CSS

---

## Backend

- Python
- FastAPI
- SQLAlchemy 2.x
- Alembic
- Pydantic v2

---

## Database

- PostgreSQL
- Supabase

---

## Storage

Supabase Storage

Used for:

- Player photos
- Transfer letters
- Registration forms
- Supporting documents

---

## Authentication

Supabase Authentication

JWT-based authentication

Role-based authorization

---

# High-Level Architecture

```
                React Frontend
                       │
                Axios REST Calls
                       │
──────────────────────────────────────
                FastAPI API
──────────────────────────────────────
                       │
                  Service Layer
                       │
                Repository Layer
                       │
               SQLAlchemy Models
                       │
             PostgreSQL (Supabase)
```

Business logic belongs only in the Service layer.

Repositories only communicate with the database.

---

# Backend Architecture

```
app/

api/
    v1/
        endpoints/

core/

database/

models/

repositories/

schemas/

services/

utils/

migrations/
```

---

# Layer Responsibilities

## Models

Responsible for:

- Database tables
- Relationships
- Constraints

Must NOT contain:

- API code
- Business logic

---

## Schemas

Responsible for:

- Validation
- Serialization
- API request models
- API response models

Each resource contains:

- Create
- Update
- Response
- ListResponse

---

## Repository Layer

Responsible for:

- CRUD
- Database queries

Repositories must NOT contain business rules.

---

## Service Layer

Responsible for:

- Validation
- Business rules
- Workflow logic
- Permission checks

Services should never know about HTTP.

They raise application exceptions.

---

## API Layer

Responsible for:

- Request validation
- Dependency injection
- Calling services
- Returning responses

Routes should remain thin.

---

# REST Standards

Resources use plural names.

Examples

```
/players

/clubs

/leagues

/transfers
```

Standard endpoints

```
GET /

GET /{id}

POST /

PATCH /{id}

DELETE /{id}
```

DELETE is only available where business rules allow it.

---

# Response Format

Single resource

```json
{
    "success": true,
    "data": {}
}
```

Collection

```json
{
    "success": true,
    "items": [],
    "total": 0
}
```

Errors

```json
{
    "detail": "..."
}
```

---

# Core Entities

League

Represents a chess league.

Contains multiple seasons.

---

Season

Represents a competition period.

Contains clubs, registrations and transfers.

---

Club

Represents a participating chess club.

Contains players and officials.

---

Player

Represents an individual chess player.

A player belongs to one club at a time.

Players may have:

- Chess.com profile
- Lichess profile
- FIDE ID

---

User Profile

Represents the authenticated system user.

Authentication is independent of player information.

---

Club Member

Represents club officials.

Examples

- Chairperson
- Secretary
- Captain

---

Registration

Represents a player's registration for a specific season.

---

Transfer

Represents a player's request to move from one club to another.

Transfers progress through approval stages.

---

Transfer Approval

Tracks approval decisions.

Multiple approvals may exist for one transfer.

---

Document

Represents uploaded files.

Examples

- Transfer letter
- Release letter
- Player photograph

Files are stored in Supabase Storage.

---

Notification

Stores user notifications.

Examples

- Registration approved
- Transfer submitted
- Transfer rejected

---

Audit Log

Records important system events.

Audit logs are immutable.

---

# Roles

Federation Admin

Can:

- Manage everything
- Approve transfers
- Manage leagues
- Manage seasons

---

League Coordinator

Can:

- Manage league operations
- Review registrations
- Review transfers

---

Club Admin

Can:

- Manage club
- Register players
- Submit transfers
- Upload documents

---

Player

Can:

- View own profile
- View own registrations
- Track transfer status

---

# Business Rules

A player:

- belongs to only one club at a time

A registration:

- belongs to one player
- belongs to one season

A transfer:

- must originate from the player's current club
- cannot target the current club
- requires approval

Completed transfers cannot be modified.

Audit logs cannot be edited.

---

# External Integrations

Chess.com API

Used to verify:

- username
- profile
- country
- avatar

---

Lichess API

Used to retrieve:

- rating
- title
- profile

---

Future integrations may include:

- Email notifications
- SMS
- Federation systems

---

# Development Workflow

Every feature follows this order.

```
Database Model

↓

Schema

↓

Repository

↓

Service

↓

API Endpoint

↓

Tests
```

Do not skip layers.

---

# Coding Standards

Use:

- async/await
- SQLAlchemy ORM
- Dependency Injection
- Type hints
- Pydantic validation

Avoid:

- print()
- duplicated queries
- business logic in routes
- raw SQL unless necessary

---

# Git Workflow

Feature Branch

↓

Pull Request

↓

Review

↓

Merge

Never commit directly to main.

---

# Current Status

Completed

- Project setup
- Database schema
- ERD
- SQLAlchemy models
- Alembic migrations
- Supabase integration
- CRUD Create endpoints
- CRUD List endpoints
- Health endpoints
- Layered architecture

In Progress

- Complete REST endpoints
- Authentication
- Authorization

Upcoming

- Business workflows
- Chess.com integration
- Lichess integration
- Notifications
- Analytics
- Testing

---

# Guiding Principles

- Keep the architecture simple.
- Prefer composition over duplication.
- Services own business logic.
- Repositories own persistence.
- APIs expose business capabilities, not database tables.
- Every new feature should fit the existing architecture before introducing new patterns.