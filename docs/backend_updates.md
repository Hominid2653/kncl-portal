# Backend Updates — KNCL Portal

This document describes backend changes required for the **player listings / engagement workflow** and **account onboarding & roster governance** introduced in the frontend (design-first phase). Implement before Phase 8 API wiring.

---

## Part 1 — Account onboarding & roster governance

### Role hierarchy

| Role | Responsibility |
|------|----------------|
| `FEDERATION_ADMIN` | Creates `LEAGUE_COORDINATOR` accounts; federation-wide settings |
| `LEAGUE_COORDINATOR` | Approves new club + captain applications; manages teams; reviews registrations/transfers |
| `CLUB_ADMIN` (captain) | Manages approved club roster; expresses interest in free agents during transfer windows |
| `PLAYER` | Self-registers profile as free agent; receives engagements; participates in transfers |

### End-to-end onboarding flow

```
Federation creates coordinator
        ↓
Captain submits club application (public)
        ↓
Coordinator approves → club + captain account created
        ↓
Captain signs in → builds roster from free agents (transfer window)
        ↓
Players self-register as free agents → appear in listings
        ↓
Captain expresses interest → player accepts → formal transfer → coordinator approves
```

### Captain / club application (pre-login)

Captains **cannot** self-provision accounts. They submit a **club & captain application** before login.

**Public endpoint:** `POST /club-applications/` (no auth)

**Request body:**

```json
{
  "club_name": "Eldoret Falcons",
  "county": "Uasin Gishu",
  "league_id": "uuid",
  "description": "optional",
  "captain_first_name": "David",
  "captain_last_name": "Kiprop",
  "captain_email": "david@example.com",
  "captain_phone": "+2547..."
}
```

**On submit:** status = `PENDING`; notify assigned league coordinator(s).

**Coordinator review:** `PATCH /club-applications/{id}`

| Action | Backend effect |
|--------|----------------|
| `APPROVED` | Create `clubs` row; create `users` row with role `CLUB_ADMIN`; link captain to club; send welcome/activation email |
| `REJECTED` | Store reason; notify applicant |

Captain portal access is **blocked** until `APPROVED`.

### Federation: coordinator account provisioning

Only `FEDERATION_ADMIN` may create coordinator accounts.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/coordinators` | Federation Admin | Create league coordinator user |
| GET | `/users/` | Federation Admin | List users (existing, extend filters) |

**POST body:**

```json
{
  "first_name": "James",
  "last_name": "Mutua",
  "email": "coordinator@kncl.local",
  "phone": "+2547..."
}
```

Server sets `role = LEAGUE_COORDINATOR`, generates activation token, audits `user.coordinator_created`.

### Player self-registration (free agent)

Players create profiles **before** joining any club. Captains **must not** create player records directly.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/player-applications/` | **Public** | Submit player profile request |
| PATCH | `/player-applications/{id}` | Coordinator | Approve/reject |

**On approve:** create `players` row with `commitment_status = FREE_AGENT`; create or link `users` row with role `PLAYER`; assign federation ID.

Approved players appear in `GET /players/listings?commitment_status=FREE_AGENT`.

### Roster rules

1. **Source:** Roster additions only from players with `commitment_status = FREE_AGENT` at time of engagement.
2. **No direct create:** Reject `POST /players/` from `CLUB_ADMIN` (or restrict to coordinator-only manual federation entry).
3. **Transfer window gate:** Roster mutations (add via transfer, remove) only when `seasons.transfers_open = true` for the active season.
4. **New teams:** After club approval, initial roster is built the same way as existing teams — free agents register, captain engages, transfer approved.
5. **Committed players:** Moves between clubs follow engagement → transfer workflow (see Part 2).

**Suggested validation middleware:**

```python
def assert_transfer_window_open(season_id: UUID) -> None:
    season = get_season(season_id)
    if not season.transfers_open:
        raise HTTPException(403, "Roster changes are only allowed during transfer windows")
```

Apply to: `POST /engagements/`, `POST /transfers/`, roster membership create/delete endpoints.

### Database additions

#### `club_captain_applications`

| Column | Type |
|--------|------|
| `id` | UUID PK |
| `club_name` | string |
| `county` | string |
| `league_id` | FK |
| `description` | text, nullable |
| `captain_first_name` | string |
| `captain_last_name` | string |
| `captain_email` | string (unique among pending) |
| `captain_phone` | string |
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` |
| `reviewed_by` | FK users, nullable |
| `reviewed_at` | timestamp, nullable |
| `created_club_id` | FK clubs, nullable (set on approve) |
| `created_captain_id` | FK users, nullable (set on approve) |
| `created_at` / `updated_at` | timestamps |

#### `player_profile_applications`

| Column | Type |
|--------|------|
| `id` | UUID PK |
| `first_name`, `last_name`, `email`, `county`, `nationality` | strings |
| `status` | enum |
| `created_player_id` | FK players, nullable |
| `federation_id` | string, nullable (assigned on approve) |
| `reviewed_by`, `reviewed_at` | nullable |
| `created_at` / `updated_at` | timestamps |

### Notifications

| Event | Recipient |
|-------|-----------|
| Club application submitted | League coordinator(s) for league |
| Club application approved | Captain email |
| Player application approved | Player email |
| Transfer window opens/closes | All club captains (optional broadcast) |

### Audit events

- `club_application.submitted` / `.approved` / `.rejected`
- `player_application.submitted` / `.approved` / `.rejected`
- `user.coordinator_created`
- `roster.change_blocked` (transfer window violation attempt)

### Frontend mapping (Phase 8)

| Frontend mock | Backend target |
|---------------|----------------|
| `/register/captain` | `POST /club-applications/` |
| `/register/player` | `POST /player-applications/` |
| `AdminClubApplicationsPage` | `GET /club-applications/`, `PATCH /club-applications/{id}` |
| `AdminUserProfilesPage` (create coordinator) | `POST /users/coordinators` |
| `ClubRosterPage` / `ClubPlayerNewPage` | `GET /players/listings?commitment_status=FREE_AGENT` + transfer window check |
| `lib/season.isTransferWindowOpen()` | `GET /seasons/current` → `transfers_open` |

---

## Part 2 — Player listings & engagements

This document describes backend changes required to support the **public player listings** and **club-to-player engagement workflow** introduced in the frontend (design-first phase). It should be implemented before Phase 8 API wiring.

---

## Overview

### User workflow

1. A **club captain** (`CLUB_ADMIN`) visits the public `/players` page.
2. They browse two views:
   - **Free agents** — players with no current club commitment.
   - **Committed players** — players affiliated with another club.
3. The captain **expresses interest** in a player with an optional message.
4. Routing depends on player commitment:
   - **Free agent** → notification/request delivered to the **player** (`PLAYER` role).
   - **Committed player** → notification/request delivered to the **current club captain** (`CLUB_ADMIN` of `player.current_club_id`).
5. The recipient **accepts or declines** in their portal, opening the path to a formal transfer request (existing `transfers` resource).

Engagements are **pre-transfer discussions**, not league-approved transfers. Acceptance should optionally allow creating a `Transfer` record in a follow-up step.

---

## New enums

Add to `backend/app/models/enums.py`:

```python
class PlayerCommitmentStatus(str, Enum):
    FREE_AGENT = "FREE_AGENT"
    COMMITTED = "COMMITTED"


class EngagementStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    WITHDRAWN = "WITHDRAWN"


class EngagementRecipientType(str, Enum):
    PLAYER = "PLAYER"
    CLUB_CAPTAIN = "CLUB_CAPTAIN"
```

---

## Database schema

### Option A — dedicated `player_engagements` table (recommended)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `player_id` | FK → `players.id` | Target player |
| `requesting_club_id` | FK → `clubs.id` | Club expressing interest |
| `requesting_captain_id` | FK → `users.id` | `CLUB_ADMIN` who sent request |
| `recipient_type` | enum | `PLAYER` or `CLUB_CAPTAIN` |
| `recipient_club_id` | FK → `clubs.id`, nullable | Set when `recipient_type = CLUB_CAPTAIN` (player's current club) |
| `message` | text | Captain's introductory message |
| `status` | enum | `PENDING`, `ACCEPTED`, `DECLINED`, `WITHDRAWN` |
| `player_commitment_status` | enum | Snapshot at time of request (`FREE_AGENT` / `COMMITTED`) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `responded_at` | timestamp, nullable | |

**Indexes**

- `(player_id, status)`
- `(recipient_club_id, status)` where `recipient_type = CLUB_CAPTAIN`
- `(requesting_club_id, status)`
- Unique partial index: one `PENDING` engagement per `(requesting_club_id, player_id)` to prevent duplicate open requests.

### Player commitment derivation

Do **not** store commitment as a separate mutable flag unless needed for performance. Derive from roster/club membership:

- `FREE_AGENT` — player has no active club membership for the current season (or `club_id IS NULL` on player profile, per existing model rules).
- `COMMITTED` — player has an active registration or roster row tied to a club.

Document the exact rule in `players` / `registrations` service layer so public listings and engagement routing stay consistent.

---

## API endpoints

Base: `/api/v1`. Add to `docs/endpoints.md` when implemented.

### Public player listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/players/listings` | **Public** | Paginated player directory for marketing page |

**Query params:** `page`, `page_size`, `search`, `commitment_status` (`FREE_AGENT` \| `COMMITTED`), `county`, `sort_by`, `sort_order`

**Response fields (per item):**

```json
{
  "id": "uuid",
  "federation_id": "string",
  "name": "string",
  "commitment_status": "FREE_AGENT",
  "club": { "id": "uuid", "name": "string" },
  "county": "string",
  "fide_rating": 1800,
  "lichess_username": "string",
  "chesscom_username": "string",
  "lichess_verified": true,
  "chesscom_verified": false,
  "nationality": "KEN",
  "title": "FM",
  "last_active": "2026-07-28T00:00:00Z"
}
```

**Privacy:** Public listings should expose only fields approved for the marketplace (no email, phone, or internal notes). Verified online handles may be shown; unverified handles optional.

### Player engagements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/engagements/` | Authenticated | List engagements visible to caller (scoped by role) |
| GET | `/engagements/{item_id}` | Authenticated | Get single engagement |
| POST | `/engagements/` | `CLUB_ADMIN` | Express interest in a player |
| PATCH | `/engagements/{item_id}` | Recipient or requesting captain | Accept, decline, or withdraw |

**POST body:**

```json
{
  "player_id": "uuid",
  "message": "We would like to discuss joining our club for the 2026 season."
}
```

**Server-side routing (on create):**

1. Validate `player_id` exists and is listable.
2. Validate caller is `CLUB_ADMIN` with a managed club.
3. Reject if `requesting_club_id` equals player's current club.
4. Compute `commitment_status` and set `recipient_type`:
   - `FREE_AGENT` → `recipient_type = PLAYER`
   - `COMMITTED` → `recipient_type = CLUB_CAPTAIN`, `recipient_club_id = player.current_club_id`
5. Reject duplicate `PENDING` engagement for same `(requesting_club_id, player_id)`.
6. Create engagement row and enqueue notification(s).

**PATCH body:**

```json
{
  "status": "ACCEPTED"
}
```

Allowed transitions:

| From | To | Who |
|------|-----|-----|
| `PENDING` | `ACCEPTED` | Recipient (player or current club captain) |
| `PENDING` | `DECLINED` | Recipient |
| `PENDING` | `WITHDRAWN` | Requesting captain |

**List scoping:**

| Role | Sees |
|------|------|
| `PLAYER` | Engagements where `recipient_type = PLAYER` and `player_id` matches their linked player profile |
| `CLUB_ADMIN` | Engagements where `recipient_type = CLUB_CAPTAIN` and `recipient_club_id` is a club they manage; optionally also engagements they initiated (`requesting_captain_id = me`) |
| `LEAGUE_COORDINATOR` / `FEDERATION_ADMIN` | All (read-only audit) |

### Dashboard aggregates

Extend existing dashboard endpoints:

| Endpoint | New fields |
|----------|------------|
| `GET /dashboard/player` | `pending_engagements_count` |
| `GET /dashboard/club` | `pending_engagements_count` |

---

## Notifications

On `POST /engagements/`:

| Recipient | Notification type | Title example |
|-----------|-------------------|---------------|
| Player (free agent) | `ENGAGEMENT_RECEIVED` | "Nairobi Kings is interested in signing you" |
| Club captain (committed) | `ENGAGEMENT_RECEIVED` | "Nairobi Kings expressed interest in Amina Hassan" |

On `PATCH` to `ACCEPTED` / `DECLINED`:

- Notify the **requesting captain**.
- If accepted, suggest next step: create formal transfer via `POST /transfers/`.

Reuse existing `notifications` table; add `engagement_id` FK (nullable) for deep links.

---

## Authorization rules

| Action | Rule |
|--------|------|
| View public listings | No auth |
| Create engagement | `CLUB_ADMIN` only; must manage `requesting_club_id` |
| Respond to engagement | Player user linked to `player_id`, OR `CLUB_ADMIN` managing `recipient_club_id` |
| Withdraw | Original `requesting_captain_id` while `PENDING` |
| Admin read | `LEAGUE_COORDINATOR`, `FEDERATION_ADMIN` |

---

## Relationship to transfers

```
Public listing → Engagement (discussion) → Transfer (formal request) → League approval
```

- Engagement acceptance does **not** auto-create a transfer.
- Optional: `POST /engagements/{id}/initiate-transfer` creates a `transfers` row with `from_club_id` / `to_club_id` pre-filled when both parties have accepted discussion terms.
- Existing `transfer_approvals` workflow remains unchanged.

---

## Audit logging

Log events:

- `engagement.created`
- `engagement.accepted`
- `engagement.declined`
- `engagement.withdrawn`

Include `player_id`, `requesting_club_id`, `recipient_club_id`, and actor user id.

---

## Migration checklist

### Part 1 — Onboarding
- [ ] Add `club_captain_applications` and `player_profile_applications` tables
- [ ] Router: public `POST /club-applications/`, `POST /player-applications/`
- [ ] Router: coordinator `GET/PATCH` review endpoints for both application types
- [ ] Router: federation `POST /users/coordinators`
- [ ] Router: coordinator `PATCH /seasons/{id}` for window toggles
- [ ] Service: approve club application → create club + captain atomically
- [ ] Service: approve player application → create player as free agent
- [ ] Middleware: transfer window guard on roster/engagement/transfer mutations
- [ ] Block `CLUB_ADMIN` from direct player creation

### Part 2 — Engagements
- [ ] Add enums to `enums.py`
- [ ] Alembic migration for `player_engagements`
- [ ] SQLAlchemy model + Pydantic schemas
- [ ] Service: commitment status resolver
- [ ] Router: `/players/listings` (public)
- [ ] Router: `/engagements` CRUD + respond
- [ ] Notification hooks
- [ ] Dashboard count fields
- [ ] Seed data for local dev (Faith Njeri free agent, Amina Hassan committed)
- [ ] Update `docs/endpoints.md` and `docs/database.md`
- [ ] Integration tests for routing logic (free agent vs committed)

### Part 3 — Headshots & seasons
- [ ] Add `headshot_url` (+ metadata) to `players`
- [ ] Blob storage + upload/URL endpoints
- [ ] Thumbnail generation for listings grid
- [ ] `PATCH /seasons/{id}` window toggles with audit log

---

## Frontend mapping (Phase 8)

| Frontend mock | Backend target |
|---------------|----------------|
| `GET /players` page | `GET /players/listings?commitment_status=...` |
| `EngagementContext.createEngagement` | `POST /engagements/` |
| `PlayerEngagementsPage` | `GET /engagements/?filter=recipient_type=PLAYER` |
| `ClubEngagementsPage` | `GET /engagements/?filter=recipient_club_id=<club>` |
| `respondToEngagement` | `PATCH /engagements/{id}` |

---

## Mock users for QA

| Email | Role | Use case |
|-------|------|----------|
| `captain.nairobi@kncl.local` | `CLUB_ADMIN` | Browse `/players`, send interest |
| `faith.njeri@kncl.local` | `PLAYER` (free agent) | Receive engagement E-001 |
| `captain.mombasa@kncl.local` | `CLUB_ADMIN` | Receive engagement E-002 for committed player |

---

## Part 3 — Player headshots & listing presentation

### Player profile photo

Add to `players` table:

| Column | Type | Notes |
|--------|------|-------|
| `headshot_url` | string, nullable | CDN URL after upload |
| `headshot_source` | enum, nullable | `UPLOAD`, `URL`, `EXTERNAL` |
| `headshot_updated_at` | timestamp, nullable | |

### API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/players/me/headshot` | `PLAYER` | Multipart upload (JPG/PNG/WebP, max 5MB) |
| PUT | `/players/me/headshot` | `PLAYER` | Set headshot from external URL (validate fetch + virus scan) |
| DELETE | `/players/me/headshot` | `PLAYER` | Remove photo; fall back to initials avatar |
| GET | `/players/listings` | Public | Include `headshot_url` in response (nullable) |

**Upload flow (recommended):**

1. Client uploads to blob storage via presigned URL OR direct multipart to API.
2. API validates MIME type, dimensions (min 200×200), file size.
3. Store URL on player record; optionally generate thumbnails (128, 256, 512).
4. Public listings serve thumbnail URL only.

**Security:**

- Reject SVG (XSS risk).
- Strip EXIF GPS data on upload.
- Optional: federation moderation queue for flagged photos.

### Season window management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/seasons/{id}` | Coordinator / Federation | Toggle `registration_open`, `transfers_open` |
| GET | `/seasons/current` | Public or Authenticated | Returns active season + window flags |

Coordinators (not only federation admins) must control transfer windows per operational requirements.

### Player application review (coordinator queue)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/player-applications/` | Coordinator | List pending/approved/rejected |
| PATCH | `/player-applications/{id}` | Coordinator | Approve (assign `federation_id`, create player + user) or reject |

On approve: player appears in `GET /players/listings?commitment_status=FREE_AGENT` with default avatar until headshot uploaded.

---

## Implemented in frontend mock (Phase 1–7)

| Feature | Mock implementation |
|---------|---------------------|
| Per-league transfer windows | `SeasonContext` — KNCL 2026 open, KWCL 2026 transfers closed |
| Coordinator league scoping | `MockUser.leagueIds`; James Mutua sees KNCL only; Grace Wanjiru sees all |
| Initial roster period | `OnboardingContext.initialRosterClubIds` on club approval |
| Engagement → transfer | `initiateTransferFromEngagement()` on `/club/engagements` outgoing tab |
| Headshot moderation | `/admin/headshot-moderation`; uploads queue before public listing |
| Charter on club application | Optional upload on `/register/captain` |
| Player registration approval | `/admin/player-applications` — approve or **reject with required message** |
| Club application rejection | Reject with required message on `/admin/club-applications` |
| Application status page | `/register/status` — lookup by email; player/club tabs |
| Auto-provision login | `AuthContext.provisionUser()` on approve; sign in with application email (password via Resend later) |
| Confirmation dialogs | Approve/reject/transfer/window toggles use `ConfirmDialog` |
| Mobile hamburger menu | `LandingLayout` sheet nav on `< md` breakpoints |

---

## Suggested improvements (remaining gaps)

| Gap | Risk | Recommendation |
|-----|------|----------------|
| **No email verification on public registration** | Fake captain/player applications | Require email OTP via Resend before application enters coordinator queue |
| **Password / welcome email not sent** | Approved users don't know how to sign in | Resend integration: welcome email + password-set link on approval |
| **Status lookup by email only** | Anyone with email can check application status | Add application ID + email OTP for status lookup (Phase 8+) |
| **No duplicate prevention** | Same player applied twice | Unique index on `player_applications.email` while `PENDING` |
| **Committed player photos** | Privacy expectations | Allow players to hide headshot when committed (config flag) |
| **Audit trail for window toggles** | Disputes over roster eligibility | Log `season.transfers_open_changed` with actor + timestamp |
| **Real-time notifications** | Users miss engagements | WebSocket or push for engagement/application events (Phase 9+) |
| **Search/indexing for player grid** | Slow at scale | Elasticsearch or Postgres full-text on name, county, federation_id |

### Player application rejection (backend)

`PATCH /player-applications/{id}` body when rejecting:

```json
{
  "status": "REJECTED",
  "rejection_reason": "Federation ID document missing. Please reapply with a valid national ID scan."
}
```

`rejection_reason` is **required** when `status = REJECTED`. Store on application row; expose to applicant via status lookup or email.

### Frontend mapping additions (Phase 8)

| Frontend mock | Backend target |
|---------------|----------------|
| `AdminPlayerApplicationsPage` | `GET/PATCH /player-applications/` with `rejection_reason` |
| `AdminClubApplicationsPage` | `GET/PATCH /club-applications/` with `rejection_reason` |
| `AdminHeadshotModerationPage` | `GET/PATCH /headshot-moderations/` |
| `AdminSeasonsPage` toggles | `PATCH /seasons/{id}` per `league_id` |
| `filterByLeagueScope` | Coordinator `league_ids` on user profile |
| `isClubInInitialRosterPeriod` | `clubs.initial_roster_period` boolean |
| `initiateTransferFromEngagement` | `POST /engagements/{id}/initiate-transfer` |
| `PlayerHeadshotUpload` | `POST /players/me/headshot` → moderation queue |
| `SeasonContext.canModifyRoster` | Transfer window OR initial roster period check |
