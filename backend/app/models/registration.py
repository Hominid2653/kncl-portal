from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import RegistrationStatus


class Registration(BaseModel):
    __tablename__ = "registrations"

    player_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("players.id"),
        nullable=False,
    )

    club_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id"),
        nullable=False,
    )

    season_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("seasons.id"),
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
    )