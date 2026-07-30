from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import ApplicationStatus


class ClubCaptainApplication(BaseModel):
    __tablename__ = "club_captain_applications"

    __table_args__ = (
        Index("ix_club_captain_applications_status", "status"),
        Index("ix_club_captain_applications_captain_email", "captain_email"),
    )

    club_name: Mapped[str] = mapped_column(String(150), nullable=False)
    county: Mapped[str] = mapped_column(String(100), nullable=False)
    league_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("leagues.id", ondelete="RESTRICT"),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text)

    captain_first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    captain_last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    captain_email: Mapped[str] = mapped_column(String(255), nullable=False)
    captain_phone: Mapped[str] = mapped_column(String(20), nullable=False)

    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus),
        default=ApplicationStatus.PENDING,
        nullable=False,
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    reviewed_by_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="SET NULL"),
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_club_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="SET NULL"),
    )
    created_captain_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="SET NULL"),
    )

    league = relationship("League")
    reviewed_by = relationship("UserProfile", foreign_keys=[reviewed_by_id])
    created_club = relationship("Club", foreign_keys=[created_club_id])
    created_captain = relationship("UserProfile", foreign_keys=[created_captain_id])
