from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UniqueConstraint
from app.models.base import BaseModel
from app.models.enums import RegistrationStatus


class Registration(BaseModel):
    __tablename__ = "registrations"

    player_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
    )

    club_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        nullable=False,
    )

    season_id: Mapped[PG_UUID] = mapped_column(
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
    
__table_args__ = (
    UniqueConstraint(
        "player_id",
        "season_id",
        name="uq_player_season_registration",
    ),
)

__table_args__ = (
    UniqueConstraint(
        "player_id",
        "season_id",
        name="uq_player_season_registration",
    ),
    Index("ix_registration_player", "player_id"),
    Index("ix_registration_club", "club_id"),
)