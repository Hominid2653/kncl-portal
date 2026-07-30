"""Deterministic seed identifiers and reference data for KNCL."""

from datetime import date, datetime, timezone
from uuid import UUID

from app.models.enums import (
    ApprovalDecision,
    RegistrationStatus,
    TransferStatus,
    UserRole,
)

# Fixed UUIDs keep seeds reproducible across environments.
LEAGUE_ID = UUID("11111111-1111-4111-8111-111111111101")
SEASON_2025_ID = UUID("11111111-1111-4111-8111-111111111102")
SEASON_2026_ID = UUID("11111111-1111-4111-8111-111111111103")

CLUB_NAIROBI_ID = UUID("22222222-2222-4222-8222-222222222201")
CLUB_MOMBASA_ID = UUID("22222222-2222-4222-8222-222222222202")
CLUB_KISUMU_ID = UUID("22222222-2222-4222-8222-222222222203")

USER_FED_ADMIN_ID = UUID("33333333-3333-4333-8333-333333333301")
USER_LEAGUE_COORD_ID = UUID("33333333-3333-4333-8333-333333333302")
USER_CLUB_ADMIN_NAIROBI_ID = UUID("33333333-3333-4333-8333-333333333303")
USER_CLUB_ADMIN_MOMBASA_ID = UUID("33333333-3333-4333-8333-333333333304")
USER_PLAYER_1_ID = UUID("33333333-3333-4333-8333-333333333305")
USER_PLAYER_2_ID = UUID("33333333-3333-4333-8333-333333333306")
USER_PLAYER_3_ID = UUID("33333333-3333-4333-8333-333333333307")

AUTH_FED_ADMIN_ID = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1")
AUTH_LEAGUE_COORD_ID = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2")
AUTH_CLUB_ADMIN_NAIROBI_ID = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3")
AUTH_CLUB_ADMIN_MOMBASA_ID = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4")
AUTH_PLAYER_1_ID = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5")
AUTH_PLAYER_2_ID = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6")
AUTH_PLAYER_3_ID = UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7")

PLAYER_1_ID = UUID("44444444-4444-4444-8444-444444444401")
PLAYER_2_ID = UUID("44444444-4444-4444-8444-444444444402")
PLAYER_3_ID = UUID("44444444-4444-4444-8444-444444444403")

CLUB_MEMBER_NAIROBI_ADMIN_ID = UUID("55555555-5555-4555-8555-555555555501")
CLUB_MEMBER_MOMBASA_ADMIN_ID = UUID("55555555-5555-4555-8555-555555555502")

REGISTRATION_1_ID = UUID("66666666-6666-4666-8666-666666666601")
REGISTRATION_2_ID = UUID("66666666-6666-4666-8666-666666666602")
REGISTRATION_3_ID = UUID("66666666-6666-4666-8666-666666666603")

TRANSFER_PENDING_ID = UUID("77777777-7777-4777-8777-777777777701")
TRANSFER_APPROVED_ID = UUID("77777777-7777-4777-8777-777777777702")

TRANSFER_APPROVAL_1_ID = UUID("88888888-8888-4888-8888-888888888801")

DOCUMENT_1_ID = UUID("99999999-9999-4999-8999-999999999901")

NOTIFICATION_1_ID = UUID("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee01")
NOTIFICATION_2_ID = UUID("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee02")

AUDIT_LOG_1_ID = UUID("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1")

SEED_NOW = datetime(2026, 1, 15, 10, 0, tzinfo=timezone.utc)
SEED_REGISTERED_AT = datetime(2026, 1, 10, 9, 0, tzinfo=timezone.utc)
SEED_TRANSFER_SUBMITTED = datetime(2026, 2, 1, 14, 30, tzinfo=timezone.utc)
SEED_TRANSFER_COMPLETED = datetime(2026, 2, 5, 16, 0, tzinfo=timezone.utc)
SEED_APPROVED_AT = datetime(2026, 2, 3, 11, 0, tzinfo=timezone.utc)
SEED_UPLOADED_AT = datetime(2026, 2, 1, 15, 0, tzinfo=timezone.utc)

LEAGUE = {
    "id": LEAGUE_ID,
    "name": "Kenya National Chess League",
    "description": "Official national chess league for club-based team competitions across Kenya.",
}

SEASONS = [
    {
        "id": SEASON_2025_ID,
        "league_id": LEAGUE_ID,
        "name": "KNCL 2025 Season",
        "year": 2025,
        "roster_enrollment_open": False,
        "transfers_open": False,
        "start_date": date(2025, 3, 1),
        "end_date": date(2025, 11, 30),
    },
    {
        "id": SEASON_2026_ID,
        "league_id": LEAGUE_ID,
        "name": "KNCL 2026 Season",
        "year": 2026,
        "roster_enrollment_open": True,
        "transfers_open": True,
        "start_date": date(2026, 3, 1),
        "end_date": date(2026, 11, 30),
    },
]

CLUBS = [
    {
        "id": CLUB_NAIROBI_ID,
        "league_id": LEAGUE_ID,
        "name": "Nairobi Chess Club",
        "county": "Nairobi",
        "description": "Premier chess club based in Nairobi.",
        "founded_year": 1998,
    },
    {
        "id": CLUB_MOMBASA_ID,
        "league_id": LEAGUE_ID,
        "name": "Mombasa Chess Warriors",
        "county": "Mombasa",
        "description": "Coastal club competing in the national league.",
        "founded_year": 2005,
    },
    {
        "id": CLUB_KISUMU_ID,
        "league_id": LEAGUE_ID,
        "name": "Kisumu Knights",
        "county": "Kisumu",
        "description": "Western Kenya club developing junior talent.",
        "founded_year": 2012,
    },
]

USER_PROFILES = [
    {
        "id": USER_FED_ADMIN_ID,
        "auth_user_id": AUTH_FED_ADMIN_ID,
        "first_name": "Grace",
        "last_name": "Wanjiru",
        "phone": "+254700000001",
        "role": UserRole.FEDERATION_ADMIN,
    },
    {
        "id": USER_LEAGUE_COORD_ID,
        "auth_user_id": AUTH_LEAGUE_COORD_ID,
        "first_name": "Daniel",
        "last_name": "Otieno",
        "phone": "+254700000002",
        "role": UserRole.LEAGUE_COORDINATOR,
    },
    {
        "id": USER_CLUB_ADMIN_NAIROBI_ID,
        "auth_user_id": AUTH_CLUB_ADMIN_NAIROBI_ID,
        "first_name": "Brian",
        "last_name": "Kamau",
        "phone": "+254700000003",
        "role": UserRole.CLUB_ADMIN,
    },
    {
        "id": USER_CLUB_ADMIN_MOMBASA_ID,
        "auth_user_id": AUTH_CLUB_ADMIN_MOMBASA_ID,
        "first_name": "Amina",
        "last_name": "Hassan",
        "phone": "+254700000004",
        "role": UserRole.CLUB_ADMIN,
    },
    {
        "id": USER_PLAYER_1_ID,
        "auth_user_id": AUTH_PLAYER_1_ID,
        "first_name": "Elias",
        "last_name": "Mwangi",
        "phone": "+254700000005",
        "role": UserRole.PLAYER,
    },
    {
        "id": USER_PLAYER_2_ID,
        "auth_user_id": AUTH_PLAYER_2_ID,
        "first_name": "Faith",
        "last_name": "Njeri",
        "phone": "+254700000006",
        "role": UserRole.PLAYER,
    },
    {
        "id": USER_PLAYER_3_ID,
        "auth_user_id": AUTH_PLAYER_3_ID,
        "first_name": "Kevin",
        "last_name": "Ochieng",
        "phone": "+254700000007",
        "role": UserRole.PLAYER,
    },
]

PLAYERS = [
    {
        "id": PLAYER_1_ID,
        "user_profile_id": USER_PLAYER_1_ID,
        "federation_id": "KEN-001",
        "fide_id": "12345678",
        "chesscom_username": "elias_mwangi",
        "lichess_username": "elias_mwangi",
        "rapid_rating": 1820,
        "blitz_rating": 1750,
        "classical_rating": 1900,
        "nationality": "Kenya",
        "date_of_birth": date(2001, 5, 12),
    },
    {
        "id": PLAYER_2_ID,
        "user_profile_id": USER_PLAYER_2_ID,
        "federation_id": "KEN-002",
        "fide_id": "23456789",
        "chesscom_username": "faith_njeri",
        "lichess_username": "faith_njeri",
        "rapid_rating": 1680,
        "blitz_rating": 1620,
        "classical_rating": 1710,
        "nationality": "Kenya",
        "date_of_birth": date(2003, 8, 22),
    },
    {
        "id": PLAYER_3_ID,
        "user_profile_id": USER_PLAYER_3_ID,
        "federation_id": "KEN-003",
        "chesscom_username": "kevin_ochieng",
        "lichess_username": "kevin_ochieng",
        "rapid_rating": 1550,
        "blitz_rating": 1490,
        "classical_rating": 1580,
        "nationality": "Kenya",
        "date_of_birth": date(2004, 11, 3),
    },
]

CLUB_MEMBERS = [
    {
        "id": CLUB_MEMBER_NAIROBI_ADMIN_ID,
        "club_id": CLUB_NAIROBI_ID,
        "user_profile_id": USER_CLUB_ADMIN_NAIROBI_ID,
        "position": "Secretary",
    },
    {
        "id": CLUB_MEMBER_MOMBASA_ADMIN_ID,
        "club_id": CLUB_MOMBASA_ID,
        "user_profile_id": USER_CLUB_ADMIN_MOMBASA_ID,
        "position": "Captain",
    },
]

REGISTRATIONS = [
    {
        "id": REGISTRATION_1_ID,
        "player_id": PLAYER_1_ID,
        "club_id": CLUB_NAIROBI_ID,
        "season_id": SEASON_2026_ID,
        "status": RegistrationStatus.APPROVED,
        "registered_at": SEED_REGISTERED_AT,
    },
    {
        "id": REGISTRATION_2_ID,
        "player_id": PLAYER_2_ID,
        "club_id": CLUB_NAIROBI_ID,
        "season_id": SEASON_2026_ID,
        "status": RegistrationStatus.APPROVED,
        "registered_at": SEED_REGISTERED_AT,
    },
    {
        "id": REGISTRATION_3_ID,
        "player_id": PLAYER_3_ID,
        "club_id": CLUB_MOMBASA_ID,
        "season_id": SEASON_2026_ID,
        "status": RegistrationStatus.PENDING,
        "registered_at": SEED_REGISTERED_AT,
    },
]

TRANSFERS = [
    {
        "id": TRANSFER_PENDING_ID,
        "registration_id": REGISTRATION_3_ID,
        "from_club_id": CLUB_MOMBASA_ID,
        "to_club_id": CLUB_KISUMU_ID,
        "reason": "Relocation to Kisumu for university studies.",
        "status": TransferStatus.PENDING,
        "submitted_at": SEED_TRANSFER_SUBMITTED,
        "completed_at": None,
    },
    {
        "id": TRANSFER_APPROVED_ID,
        "registration_id": REGISTRATION_2_ID,
        "from_club_id": CLUB_NAIROBI_ID,
        "to_club_id": CLUB_MOMBASA_ID,
        "reason": "Accepted coaching role at Mombasa Chess Warriors.",
        "status": TransferStatus.APPROVED,
        "submitted_at": SEED_TRANSFER_SUBMITTED,
        "completed_at": SEED_TRANSFER_COMPLETED,
    },
]

TRANSFER_APPROVALS = [
    {
        "id": TRANSFER_APPROVAL_1_ID,
        "transfer_id": TRANSFER_APPROVED_ID,
        "approved_by": USER_FED_ADMIN_ID,
        "decision": ApprovalDecision.APPROVED,
        "remarks": "All release documents received and verified.",
        "approved_at": SEED_APPROVED_AT,
    },
]

DOCUMENTS = [
    {
        "id": DOCUMENT_1_ID,
        "transfer_id": TRANSFER_PENDING_ID,
        "uploaded_by": USER_CLUB_ADMIN_MOMBASA_ID,
        "document_type": "release_letter",
        "file_name": "kevin_ochieng_release.pdf",
        "file_url": "https://example.supabase.co/storage/v1/object/docs/kevin_ochieng_release.pdf",
        "uploaded_at": SEED_UPLOADED_AT,
    },
]

NOTIFICATIONS = [
    {
        "id": NOTIFICATION_1_ID,
        "user_profile_id": USER_PLAYER_3_ID,
        "title": "Transfer request submitted",
        "message": "Your transfer from Mombasa Chess Warriors to Kisumu Knights is pending approval.",
        "is_read": False,
    },
    {
        "id": NOTIFICATION_2_ID,
        "user_profile_id": USER_FED_ADMIN_ID,
        "title": "Transfer awaiting review",
        "message": "A new transfer request requires federation review.",
        "is_read": False,
    },
]

AUDIT_LOGS = [
    {
        "id": AUDIT_LOG_1_ID,
        "user_profile_id": USER_FED_ADMIN_ID,
        "action": "SEED_DATABASE",
        "entity": "system",
        "entity_id": None,
        "ip_address": "127.0.0.1",
    },
]
