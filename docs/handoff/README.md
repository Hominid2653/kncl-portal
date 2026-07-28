# Backend Handoff — Frontend Integration Guide

This folder is the **frontend team's starting point** for integrating with the KNCL Transfer Portal API.

The backend is feature-complete for MVP workflows: authentication, CRUD, registrations, transfers, documents, dashboards, and Lichess/Chess.com account linking.

---

## Read in this order

| # | Document | Purpose |
|---|----------|---------|
| 1 | [Quickstart](./quickstart.md) | Run the API locally, seed data, Swagger |
| 2 | [Authentication](./authentication.md) | Supabase login → Bearer token → Axios |
| 3 | [Test users & seed data](./test-users.md) | Seeded roles, UUIDs, mock headers |
| 4 | [Workflows](./workflows.md) | Registration, transfer, uploads, external accounts |
| 5 | [API conventions](./api-conventions.md) | Errors, pagination, list responses, CORS notes |

---

## Canonical API reference

Full endpoint list (67+ routes): **[`../endpoints.md`](../endpoints.md)**

Interactive docs (server running): **http://localhost:8000/docs**

---

## Base URL

| Environment | Base URL |
|-------------|----------|
| Local | `http://127.0.0.1:8000/api/v1` |
| Staging / production | _TBD — backend team will provide_ |

All routes below are relative to `/api/v1`.

---

## Roles

| Role | Frontend surfaces |
|------|-------------------|
| `PLAYER` | Player dashboard, profile, registrations, transfer requests |
| `CLUB_ADMIN` | Club dashboard, player management, document uploads |
| `LEAGUE_COORDINATOR` | Approvals, league-wide lists, admin dashboard |
| `FEDERATION_ADMIN` | Full admin access, league/club setup |

List and GET endpoints **scope results by role** automatically. The frontend should not try to filter by role client-side for security — rely on the API.

---

## Suggested frontend build order

1. **Auth** — Supabase login, store session, attach Bearer token to Axios
2. **Player dashboard** — `GET /dashboard/player`
3. **Profile + external accounts** — user profile, player record, Lichess/Chess.com lookup
4. **Registration submit** — `POST /registrations/`
5. **Transfer submit** — `POST /transfers/` + document upload
6. **Club / league dashboards** — role-gated routes + approval actions

---

## Backend contacts & repo layout

```
backend/          FastAPI application (this handoff covers this)
frontend/         React app (to be built)
docs/endpoints.md Full API contract
docs/handoff/     This folder
```

For contract questions or missing fields, open an issue or sync with the backend team before changing the API shape.
