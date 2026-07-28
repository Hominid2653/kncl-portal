from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
from app.models.enums import RegistrationStatus


class Registration(BaseModel):
    __tablename__ = "registrations"

    __table_args__ = (
        UniqueConstraint(
            "player_id",
            "season_id",
            name="uq_player_season_registration",
        ),
        Index("ix_registration_player", "player_id"),
        Index("ix_registration_club", "club_id"),
    )

    player_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
    )

    club_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        nullable=False,
    )

    season_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("seasons.id", ondelete="CASCADE"),
        nullable=False,
    )

    status: Mapped[RegistrationStatus] = mapped_column(
        Enum(RegistrationStatus),
        nullable=False,
    )

    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    player = relationship(
        "Player",
        back_populates="registrations",
    )

    club = relationship(
        "Club",
        back_populates="registrations",
    )

    season = relationship(
        "Season",
        back_populates="registrations",
    )

    transfers = relationship(
        "Transfer",
        back_populates="registration",
        cascade="all, delete-orphan",
    )
