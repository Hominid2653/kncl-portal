# Entity Relationship Diagram

```mermaid
erDiagram

USER_PROFILES ||--|| PLAYERS : owns

USER_PROFILES ||--o| CLUBS : manages

PLAYERS ||--o{ REGISTRATIONS : registers

CLUBS ||--o{ REGISTRATIONS : receives

SEASONS ||--o{ REGISTRATIONS : contains

REGISTRATIONS ||--o{ TRANSFERS : creates

TRANSFERS ||--o{ TRANSFER_APPROVALS : requires

TRANSFERS ||--o{ DOCUMENTS : contains

USER_PROFILES ||--o{ NOTIFICATIONS : receives

USER_PROFILES ||--o{ AUDIT_LOGS : performs
```

## External Authentication

```
Supabase Auth

auth.users

        │
        ▼

user_profiles
```

Authentication is managed entirely by Supabase Auth.

Application data is stored inside PostgreSQL and accessed using SQLAlchemy.