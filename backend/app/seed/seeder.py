from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models import (
    AuditLog,
    Club,
    ClubMember,
    Document,
    League,
    Notification,
    Player,
    Registration,
    Season,
    Transfer,
    TransferApproval,
    UserProfile,
)
from app.seed import data


TABLES_IN_DELETE_ORDER = [
    "audit_logs",
    "notifications",
    "documents",
    "transfer_approvals",
    "transfers",
    "registrations",
    "club_members",
    "players",
    "user_profiles",
    "clubs",
    "seasons",
    "leagues",
]


def is_seeded(db: Session) -> bool:
    return db.scalar(select(League.id).where(League.id == data.LEAGUE_ID).limit(1)) is not None


def clear_seed_data(db: Session) -> None:
    table_list = ", ".join(TABLES_IN_DELETE_ORDER)
    db.execute(text(f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE"))
    db.commit()


def seed_database(db: Session, *, reset: bool = False) -> dict[str, int]:
    if reset:
        clear_seed_data(db)
    elif is_seeded(db):
        return {"skipped": 1}

    counts: dict[str, int] = {}

    league = League(**data.LEAGUE)
    db.add(league)
    counts["leagues"] = 1

    db.add_all(Season(**season) for season in data.SEASONS)
    counts["seasons"] = len(data.SEASONS)

    db.add_all(Club(**club) for club in data.CLUBS)
    counts["clubs"] = len(data.CLUBS)

    db.add_all(UserProfile(**profile) for profile in data.USER_PROFILES)
    counts["user_profiles"] = len(data.USER_PROFILES)

    db.add_all(Player(**player) for player in data.PLAYERS)
    counts["players"] = len(data.PLAYERS)

    db.add_all(ClubMember(**member) for member in data.CLUB_MEMBERS)
    counts["club_members"] = len(data.CLUB_MEMBERS)

    db.add_all(Registration(**registration) for registration in data.REGISTRATIONS)
    counts["registrations"] = len(data.REGISTRATIONS)

    db.add_all(Transfer(**transfer) for transfer in data.TRANSFERS)
    counts["transfers"] = len(data.TRANSFERS)

    db.add_all(TransferApproval(**approval) for approval in data.TRANSFER_APPROVALS)
    counts["transfer_approvals"] = len(data.TRANSFER_APPROVALS)

    db.add_all(Document(**document) for document in data.DOCUMENTS)
    counts["documents"] = len(data.DOCUMENTS)

    db.add_all(Notification(**notification) for notification in data.NOTIFICATIONS)
    counts["notifications"] = len(data.NOTIFICATIONS)

    db.add_all(AuditLog(**audit_log) for audit_log in data.AUDIT_LOGS)
    counts["audit_logs"] = len(data.AUDIT_LOGS)

    db.commit()
    return counts
