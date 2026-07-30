# KNCL Portal — Implementation Roadmap

Tracks backend + Phase 8 frontend wiring. Canonical rules: `docs/backend_updates.md` § Business rules.  
Frontend mock reference: `frontend/src/lib/business-rules.ts`.

**Legend:** `[x]` done · `[~]` in progress · `[ ]` not started

---

## Phase 0 — Align & inventory

| Status | Task | Output |
|--------|------|--------|
| [x] | Create this roadmap | `docs/ROADMAP.md` |
| [x] | Gap matrix in `backend_updates.md` | Parts 1–4 + canonical rules |
| [x] | Frontend API client scaffold | `frontend/src/api/client.ts` |
| [ ] | Sync `docs/endpoints.md` with new routes | As phases complete |
| [ ] | Document Supabase → Bearer flow for frontend | `docs/frontend-auth.md` |

---

## Phase 1 — Schema & domain foundation

| Status | Task | Output |
|--------|------|--------|
| [x] | New enums (`ApplicationStatus`, `OtpPurpose`, `TransferSource`, …) | `app/models/enums.py` |
| [x] | `email_verifications` table + model | Migration + `EmailVerification` |
| [x] | `club_captain_applications` table + model | Migration + model |
| [x] | `player_profile_applications` table + model | Migration + model |
| [x] | Rename `seasons.registration_open` → `roster_enrollment_open` | Migration + model/schema |
| [x] | `clubs.initial_roster_period_active`, `approved_roster_count` | Migration + model |
| [x] | `transfers.source`, `player_id`, `engagement_id`, `submitted_by_user_profile_id` | Migration + model |
| [x] | `user_profiles.coordinator_league_ids` (UUID array) | Migration + model |
| [x] | Service skeletons | `otp_service`, `email_service`, `application_service`, `provisioning_service` |
| [x] | `Engagement` model + migration | `player_engagements` |
| [x] | Unit tests for window / roster rules | `tests/test_business_rules.py` |

---

## Phase 2 — Auth, OTP & Resend

| Status | Task | Output |
|--------|------|--------|
| [x] | Config: Resend + OTP settings | `app/core/config.py`, `.env.example` |
| [x] | `OtpService` (generate, verify, rate-limit) | `app/services/otp_service.py` |
| [x] | `EmailService` (Resend HTTP + dev fallback) | `app/services/email_service.py` |
| [x] | Email verification JWT helpers | `app/services/email_verification_token.py` |
| [x] | `POST /auth/otp/request` | `app/api/v1/endpoints/auth_otp.py` |
| [x] | `POST /auth/otp/verify` | same |
| [x] | `GET /application-status` (verification token) | `app/api/v1/endpoints/application_status.py` |
| [x] | `ProvisioningService` stub (Supabase Admin) | `app/services/provisioning_service.py` |
| [x] | Integration tests for OTP flow | `tests/test_otp_auth.py` |
| [x] | Wire frontend `api/auth-otp.ts` to real API | Phase 7 |

---

## Phase 3 — Onboarding APIs

| Status | Task |
|--------|------|
| [x] | `POST /club-applications/` (requires verification token) |
| [x] | `POST /player-applications/` |
| [x] | Coordinator `GET/PATCH` review endpoints |
| [x] | `POST /users/coordinators` (federation) |
| [x] | Approve → `ProvisioningService` + welcome email |
| [~] | Wire `OnboardingContext` (`api/applications.ts`; loads/reviews via API when `VITE_USE_API`) |

---

## Phase 4 — Roster enrollment & transfers

| Status | Task |
|--------|------|
| [x] | Refactor `RegistrationService` → roster enrollment rules |
| [x] | `POST /roster-enrollments/` alias; engagement-initiated path |
| [x] | `TransferService`: `PLAYER_REQUEST`, `ENGAGEMENT` sources |
| [x] | Window guards + `409` on double review |
| [x] | Initial roster period ends at `MIN_ROSTER_SIZE` |
| [x] | Wire `RosterEnrollmentContext`, `TransferContext` (API + mock fallback) |

---

## Phase 5 — Engagements & public listings

| Status | Task |
|--------|------|
| [x] | `player_engagements` migration + API |
| [x] | `GET /players/listings` (public) |
| [x] | Headshot moderation API |
| [x] | Wire engagement + listings pages (`EngagementContext`, `PlayerListingsContext`, `PortalDataContext`) |

---

## Phase 6 — Seasons, dashboard & polish

| Status | Task |
|--------|------|
| [x] | `PATCH /seasons/{id}` window toggles + audit |
| [x] | Dashboard pending counts |
| [x] | Coordinator `league_ids` scoping on queues |
| [x] | In-app notifications for key events |

---

## Phase 7 — Frontend Phase 8 completion

Wire order: Auth → OTP/applications → admin queues → seasons → engagements → enrollments/transfers → documents/dashboards.

| Status | Task |
|--------|------|
| [x] | Supabase SDK login + `api/client.ts` (`api/auth.ts`, dev mock headers) |
| [x] | Replace OTP mock (`api/auth-otp.ts`) |
| [x] | Replace onboarding mock (`api/applications.ts`, `OnboardingContext`) |
| [x] | Replace engagement/transfer mocks (`EngagementContext`, `TransferContext`, `RosterEnrollmentContext`) |
| [x] | `PortalDataContext` — leagues, clubs, players, dashboards, notifications, documents |
| [x] | All portal pages use contexts instead of direct `mockData` imports |
| [x] | `VITE_USE_API` / `VITE_API_MOCK` flag (`lib/api-config.ts`) |

---

## Phase 8 — Hardening & launch

| Status | Task |
|--------|------|
| [ ] | E2E: register → OTP → approve → login |
| [ ] | CI pytest on push |
| [ ] | Staging Resend domain |
| [ ] | Player headshot privacy toggle |
| [ ] | Audit log for window toggles |

---

## Current sprint focus

**Phase 7 complete** — Frontend wired to backend via `VITE_USE_API=true`. Mock data retained only as offline fallback in contexts.

**Next sprint:** Phase 8 — E2E, CI, production Resend domain.
