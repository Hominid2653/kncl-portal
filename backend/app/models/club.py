from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

class Club(BaseModel):
    __tablename__ = "clubs"

    __table_args__ = (
        UniqueConstraint(
            "league_id",
            "name",
            name="uq_league_club_name",
        ),
        Index("ix_club_name", "name"),
    )

    league_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("leagues.id", ondelete="CASCADE"),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(150))
    county: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    logo: Mapped[str | None] = mapped_column(Text)
    founded_year: Mapped[int | None] = mapped_column(Integer)

    initial_roster_period_active: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    approved_roster_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    league = relationship("League", back_populates="clubs")
    
    members = relationship(
        "ClubMember",
        back_populates="club",
        cascade="all, delete-orphan",
    )

    registrations = relationship(
        "Registration",
        back_populates="club",
        cascade="all, delete-orphan",
    )

    outgoing_transfers = relationship(
        "Transfer",
        foreign_keys="Transfer.from_club_id",
        back_populates="from_club",
    )

    incoming_transfers = relationship(
        "Transfer",
        foreign_keys="Transfer.to_club_id",
        back_populates="to_club",
    )
