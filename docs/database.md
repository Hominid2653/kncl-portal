# Database Design

## Overview

The KNCL Transfer Portal uses a relational PostgreSQL database hosted on Supabase. SQLAlchemy serves as the Object Relational Mapper (ORM), allowing the FastAPI backend to interact with the database through Python models.

The database is designed to support player registration, club management, transfer workflows, role-based access control, document management, notifications, and auditing.

---

# Entity Overview

| Entity | Purpose |
|---------|----------|
| Roles | Defines user permissions |
| Users | Stores authenticated users |
| Players | Stores player-specific information |
| Clubs | Registered chess clubs |
| Seasons | League seasons |
| Registrations | Club registrations per season |
| Transfers | Player transfer requests |
| Transfer Approvals | Multi-stage approvals |
| Documents | Uploaded documents |
| Notifications | User notifications |
| Audit Logs | Tracks system activity |

---

# Roles

Represents the available system roles.

| Field | Type | Constraints |
|--------|------|------------|
| id | Integer | Primary Key |
| name | String | Unique |

Default Roles

- Player
- Club Administrator
- League Coordinator
- Federation Administrator

---

# Users

Stores all authenticated users.

| Field | Type |
|--------|------|
| id | UUID |
| first_name | String |
| last_name | String |
| email | String |
| phone | String |
| role_id | Foreign Key |
| created_at | Timestamp |
| updated_at | Timestamp |

Relationships

- Belongs to one Role
- May own one Player profile
- May administer one Club

---

# Players

Stores player information.

| Field | Type |
|--------|------|
| id | UUID |
| user_id | Foreign Key |
| federation_id | String |
| fide_id | String |
| chesscom_username | String |
| lichess_username | String |
| rapid_rating | Integer |
| blitz_rating | Integer |
| classical_rating | Integer |
| date_of_birth | Date |
| nationality | String |
| profile_photo | String |

Relationships

- Belongs to one User
- Can have many Registrations
- Can have many Transfers

---

# Clubs

Stores chess club information.

| Field | Type |
|--------|------|
| id | UUID |
| name | String |
| county | String |
| logo | String |
| description | Text |
| admin_id | Foreign Key |
| founded_year | Integer |
| created_at | Timestamp |

Relationships

- Has many Players
- Has many Registrations
- Has many Transfers

---

# Seasons

Represents each league season.

| Field | Type |
|--------|------|
| id | UUID |
| name | String |
| start_date | Date |
| end_date | Date |
| registration_open | Boolean |
| transfers_open | Boolean |

Relationships

- Has many Registrations
- Has many Transfers

---

# Registrations

Represents a player's registration to a club.

| Field | Type |
|--------|------|
| id | UUID |
| player_id | Foreign Key |
| club_id | Foreign Key |
| season_id | Foreign Key |
| status | Enum |
| registered_at | Timestamp |

Status

- Pending
- Approved
- Rejected

---

# Transfers

Represents transfer requests.

| Field | Type |
|--------|------|
| id | UUID |
| player_id | Foreign Key |
| from_club_id | Foreign Key |
| to_club_id | Foreign Key |
| season_id | Foreign Key |
| reason | Text |
| status | Enum |
| submitted_at | Timestamp |
| approved_at | Timestamp |

Status

- Pending
- Approved
- Rejected
- Cancelled

---

# Transfer Approvals

Stores approvals from multiple stakeholders.

| Field | Type |
|--------|------|
| id | UUID |
| transfer_id | Foreign Key |
| approver_id | Foreign Key |
| role | String |
| decision | Enum |
| remarks | Text |
| approved_at | Timestamp |

Decision

- Approved
- Rejected

---

# Documents

Stores uploaded files.

| Field | Type |
|--------|------|
| id | UUID |
| transfer_id | Foreign Key |
| uploaded_by | Foreign Key |
| file_name | String |
| file_url | String |
| document_type | String |
| uploaded_at | Timestamp |

Stored in Supabase Storage.

---

# Notifications

| Field | Type |
|--------|------|
| id | UUID |
| user_id | Foreign Key |
| title | String |
| message | Text |
| is_read | Boolean |
| created_at | Timestamp |

---

# Audit Logs

Tracks important actions.

| Field | Type |
|--------|------|
| id | UUID |
| user_id | Foreign Key |
| action | String |
| entity | String |
| entity_id | UUID |
| created_at | Timestamp |

---

# Future Tables

- League Fixtures
- Matches
- Payments
- Licenses
- Appeals
- Tournament Registrations