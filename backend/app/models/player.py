from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


class Player(BaseModel):
    __tablename__ = "players"

    __table_args__ = (
        Index("ix_player_fide", "fide_id"),
        Index("ix_player_chesscom", "chesscom_username"),
        Index("ix_player_lichess", "lichess_username"),
    )

    user_profile_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        unique=True,
    )

    federation_id: Mapped[str | None] = mapped_column(String(50))
    fide_id: Mapped[str | None] = mapped_column(String(50))
    chesscom_username: Mapped[str | None] = mapped_column(String(100))
    lichess_username: Mapped[str | None] = mapped_column(String(100))

    lichess_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    lichess_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    lichess_user_id: Mapped[str | None] = mapped_column(String(100))
    lichess_verification_code: Mapped[str | None] = mapped_column(String(32))

    chesscom_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    chesscom_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    chesscom_verification_code: Mapped[str | None] = mapped_column(String(32))

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
