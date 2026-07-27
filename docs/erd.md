# Entity Relationship Diagram (ERD)

```mermaid
erDiagram

ROLES ||--o{ USERS : has

USERS ||--|| PLAYERS : owns

USERS ||--o| CLUBS : manages

PLAYERS ||--o{ REGISTRATIONS : registers

CLUBS ||--o{ REGISTRATIONS : receives

SEASONS ||--o{ REGISTRATIONS : contains

PLAYERS ||--o{ TRANSFERS : submits

CLUBS ||--o{ TRANSFERS : source

CLUBS ||--o{ TRANSFERS : destination

SEASONS ||--o{ TRANSFERS : belongs_to

TRANSFERS ||--o{ DOCUMENTS : contains

TRANSFERS ||--o{ TRANSFER_APPROVALS : requires

USERS ||--o{ NOTIFICATIONS : receives

USERS ||--o{ AUDIT_LOGS : performs
```

## Notes

- UUIDs are used as primary keys.
- PostgreSQL is hosted on Supabase.
- SQLAlchemy manages relationships.
- Documents are stored in Supabase Storage.
- Authentication is handled by Supabase Auth.