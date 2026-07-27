# KNCL Transfer Portal

## Kenyan National Chess League Registration & Transfer Management System

A full-stack web application that digitizes the player registration and transfer process for the Kenyan National Chess League. The platform enables players, clubs, league coordinators, and Chess Kenya Federation administrators to manage registrations, transfers, approvals, and player records through a secure and centralized system.

---

## Project Objectives

- Digitize player registration.
- Simplify player transfer workflows.
- Eliminate paper-based processes.
- Improve transparency and tracking.
- Verify player profiles using Chess.com and Lichess.
- Provide analytics and reporting for league administrators.

---

## Tech Stack

### Frontend

- React
- React Router
- Axios
- Tailwind CSS
- JavaScript
- Vite

### Backend

- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- Uvicorn

### Database

-## Database

The application uses **Supabase PostgreSQL** as the primary database.

Authentication is **not stored inside the application database**.

Instead:

- Supabase Auth manages users
- FastAPI validates JWTs
- SQLAlchemy manages application entities
- User information is stored in a `user_profiles` table linked to `auth.users`.


### Authentication

- Supabase Authentication

### Storage

- Supabase Storage

### External APIs

- Chess.com Public API
- Lichess API

### Version Control

- Git
- GitHub

---

## Project Architecture

The KNCL Transfer Portal follows a modern three-tier architecture using Supabase as the backend infrastructure provider and FastAPI as the application server.

```
                React Frontend
                      │
                Axios / REST API
                      │
                      ▼
               FastAPI Backend
                      │
          SQLAlchemy ORM + Pydantic
                      │
                      ▼
        Supabase PostgreSQL Database
                      │
      ┌───────────────┼────────────────┐
      │               │                │
      ▼               ▼                ▼
 Supabase Auth   Supabase Storage   PostgreSQL
      │
      ▼
 auth.users
      │
      ▼
 user_profiles
```

### Responsibilities

| Component | Responsibility |
|------------|---------------|
| React | User Interface |
| FastAPI | Business Logic & REST APIs |
| SQLAlchemy | ORM |
| Supabase PostgreSQL | Database |
| Supabase Auth | Authentication & JWT |
| Supabase Storage | Document Storage |
| Chess.com API | Player Verification |
| Lichess API | Player Verification |


```
                React Frontend
                      │
                      │ REST API
                      ▼
                FastAPI Backend
                      │
          SQLAlchemy ORM + Pydantic
                      │
                      ▼
          Supabase PostgreSQL Database
                      │
        ┌─────────────┴─────────────┐
        │                           │
 Supabase Authentication     Supabase Storage
        │                           │
        └─────────────┬─────────────┘
                      │
             Chess.com & Lichess APIs
```

---

## Repository Structure

```
kncl-transfer-portal/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── requirements.txt
│   └── README.md
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── erd.md
│   ├── user-stories.md
│   ├── setup.md
│   └── meeting-notes.md
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Team

### Backend Team

**Elias** (Team Lead)
- Backend architecture
- FastAPI development
- Database design
- SQLAlchemy
- Supabase integration
- Authentication
- External API integration
- Code review

**Purity**
- Backend development
- API endpoints
- Business logic
- Testing
- Documentation

### Frontend Team

**Edwin**
- Frontend architecture
- React application
- Routing
- Shared components
- Dashboard development

**Hashim**
- React pages
- Forms
- Responsive design
- UI improvements
- Frontend testing

---

## Git Workflow

Main branches

```
main
develop
```

Feature branches

```
frontend/login
frontend/dashboard
frontend/player-profile

backend/authentication
backend/players
backend/transfers
backend/clubs
```

Workflow

```
Feature Branch
      │
      ▼
Pull Request
      │
      ▼
Code Review
      │
      ▼
develop
      │
      ▼
main
```

---

## Getting Started

Clone the repository

```bash
git clone <repository-url>
cd kncl-transfer-portal
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:
```
http://localhost:5173
```

Backend:
```
http://localhost:8000
```

API Documentation:
```
http://localhost:8000/docs
```

ReDoc:
```
http://localhost:8000/redoc
```

---

## Documentation

Project documentation is available in the `docs/` folder.

- System Architecture
- API Documentation
- Entity Relationship Diagram (ERD)
- User Stories
- Database Design
- Meeting Notes
- Deployment Guide

---

## Contribution Guidelines

- Create a feature branch before starting work.
- Commit regularly with meaningful commit messages.
- Open a Pull Request for review.
- Do not push directly to `main`.
- Ensure your code is tested before requesting a review.

---

## Future Enhancements

- Fixture and tournament management
- Player licensing
- Mobile application
- Email and SMS notifications
- Digital player ID cards
- Payment integration for league registration
- Advanced analytics dashboard

---

## License

This project is developed as an academic project for the Kenyan National Chess League and Kabarak University.