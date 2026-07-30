# KNCL Backend — To-Do

Track progress here. Check items off as they are completed.

Last updated: 2026-07-28

---

## Completed

- [x] Project setup (FastAPI, SQLAlchemy, Alembic, Pydantic v2)
- [x] Database schema and migrations
- [x] SQLAlchemy models and repositories
- [x] Pydantic schemas (Create, Update, Response, ListResponse)
- [x] Full REST CRUD for all 12 resources (58 routes)
- [x] Pagination, filtering, sorting, search on list endpoints
- [x] Database seeding (`python -m app.seed.run` / `--reset`)
- [x] Health endpoints (`/health`, `/health/db`)
- [x] Error handling and structured API responses
- [x] Supabase JWT authentication (Bearer token + dev mock headers)
- [x] Role-based authorization on all endpoints
- [x] List scoping and per-resource access checks (`AuthorizationService`)
- [x] Integration and authorization test suite (94+ tests passing)
- [x] API documentation (`docs/endpoints.md`)
- [x] Auth smoke test (`python -m app.auth.check`)
- [x] Transfer workflow (submit, approve, reject, cancel, notifications, audit logs)
- [x] Registration workflow (submit, approve, reject, notifications, audit logs)
- [x] File uploads via Supabase Storage (`POST /documents/upload`, signed download URLs)
- [x] Dashboard APIs (`/dashboard/admin`, `/dashboard/club`, `/dashboard/player`)
- [x] Real Supabase JWT verification (HS256 legacy + JWKS ES256/RS256)
- [x] Lichess integration (verify username, fetch profile/ratings, sync player ratings)
- [x] Chess.com integration (verify username, fetch profile/ratings, sync player ratings)
- [x] External account verification (`lichess_verified`, `chesscom_verified`, bio/name/admin flows)

---

## In progress

_None — pick the next item from Upcoming._

---

## Upcoming (priority order)

### 1. Transfer workflow — done

Moved to Completed. See `TransferService` and `tests/test_transfer_workflow.py`.

### 2. Registration workflow — done

Moved to Completed. See `RegistrationService` and `tests/test_registration_workflow.py`.

### 3. File uploads — done

Moved to Completed. See `StorageService`, `DocumentService`, and `tests/test_document_upload.py`.

### 4. Real Supabase JWT verification — done

Supports legacy HS256 (`SUPABASE_JWT_SECRET`) and newer ECC/RSA tokens via JWKS (`SUPABASE_URL`). See `app/core/security.py`, `app/core/supabase_jwks.py`, and `tests/test_jwt_verification.py`.

### 5. Dashboard / analytics APIs — done

Moved to Completed. See `DashboardService` and `tests/test_dashboard.py`.

### 6. External integrations — done

Chess.com and Lichess integrations with verification, rating sync, caching, and rate limiting. See `tests/test_lichess_integration.py` and `tests/test_external_account_helpers.py`.

### 7. Frontend handoff

- [x] Backend handoff docs in `docs/handoff/`
- [ ] Confirm `docs/endpoints.md` is shared with frontend team
- [ ] Provide seeded test users and roles for local integration (see `docs/handoff/test-users.md`)
- [ ] Support frontend as endpoints are wired up (issues, contract tweaks)

---

## Housekeeping

- [ ] Update `architecture.md` “Current Status” section (still lists auth as in progress)
- [ ] Remove or archive leftover scaffold scripts (e.g. `.update_crud_endpoints*.py`) if no longer needed
- [ ] CI pipeline (run `pytest` on push/PR) if not already set up

---

## Notes

- **Layer order for new features:** Model → Schema → Repository → Service → API → Tests
- **Business logic belongs in services**, not routes or repositories
- **Run tests:** `pytest tests/ -q`
- **Seed reference IDs:** `app/seed/data.py`
