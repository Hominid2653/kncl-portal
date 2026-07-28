from uuid import UUID

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ClubMember(BaseModel):
    __tablename__ = "club_members"

    club_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id"),
    )

    user_profile_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id"),
    )

    position: Mapped[str] = mapped_column(String(50))

    club = relationship("Club", back_populates="members")

    user_profile = relationship("UserProfile", back_populates="club_memberships")