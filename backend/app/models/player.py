from datetime import date
from uuid import UUID

from sqlalchemy import ForeignKey, Index, Integer, String, Date
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UniqueConstraint
from app.models.base import BaseModel

federation_id = mapped_column(
        String(50),
        unique=True,
    )

fide_id = mapped_column(
        String(50),
        unique=True,
    )
class Player(BaseModel):
    __tablename__ = "players"

    user_profile_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        unique=True,
    )

    federation_id: Mapped[str | None] = mapped_column(String(50))
    fide_id: Mapped[str | None] = mapped_column(String(50))
    chesscom_username: Mapped[str | None] = mapped_column(String(100))
    lichess_username: Mapped[str | None] = mapped_column(String(100))

    rapid_rating: Mapped[int | None] = mapped_column(Integer)
    blitz_rating: Mapped[int | None] = mapped_column(Integer)
    classical_rating: Mapped[int | None] = mapped_column(Integer)

    nationality: Mapped[str | None] = mapped_column(String(100))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    profile_photo: Mapped[str | None] = mapped_column(String)

    user_profile = relationship("UserProfile", back_populates="player")

    registrations = relationship(
    "Registration",
    back_populates="player",
    cascade="all, delete-orphan",
    )


__table_args__ = (
    Index("ix_player_fide", "fide_id"),
    Index("ix_player_chesscom", "chesscom_username"),
    Index("ix_player_lichess", "lichess_username"),
)