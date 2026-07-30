from uuid import UUID

from sqlalchemy import Enum, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import UserRole
from app.models.types import UUIDList


class UserProfile(BaseModel):
    __tablename__ = "user_profiles"

    auth_user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
        nullable=False,
    )

    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(20))

    role: Mapped[UserRole] = mapped_column(Enum(UserRole))

    coordinator_league_ids: Mapped[list[UUID] | None] = mapped_column(
        UUIDList(),
        nullable=True,
    )

    player = relationship("Player", back_populates="user_profile", uselist=False)

    club_memberships = relationship("ClubMember", back_populates="user_profile")

    notifications = relationship("Notification", back_populates="user_profile")

    audit_logs = relationship("AuditLog", back_populates="user_profile")