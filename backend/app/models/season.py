from datetime import date

from sqlalchemy import Boolean, ForeignKey, Integer, String, Date, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

__table_args__ = (
    UniqueConstraint(
        "league_id",
        "year",
        name="uq_league_year",
    ),
)

class Season(BaseModel):
    __tablename__ = "seasons"

    league_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("leagues.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    registration_open: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    transfers_open: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    start_date: Mapped[date | None] = mapped_column(Date)

    end_date: Mapped[date | None] = mapped_column(Date)

    league = relationship(
        "League",
        back_populates="seasons",
    )

    registrations = relationship(
        "Registration",
        back_populates="season",
        cascade="all, delete-orphan",
    )