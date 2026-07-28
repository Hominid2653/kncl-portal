from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Club(BaseModel):
    __tablename__ = "clubs"

    league_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("leagues.id"),
    )

    name: Mapped[str] = mapped_column(String(150))
    county: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    logo: Mapped[str | None] = mapped_column(Text)
    founded_year: Mapped[int | None] = mapped_column(Integer)

    league = relationship("League", back_populates="clubs")

    members = relationship("ClubMember", back_populates="club")

    registrations = relationship("Registration", back_populates="club")

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