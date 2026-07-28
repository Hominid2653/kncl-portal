from uuid import UUID

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import UniqueConstraint
from app.models.base import BaseModel


class ClubMember(BaseModel):
    __tablename__ = "club_members"

    club_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
    )

    user_profile_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
    )

    position: Mapped[str] = mapped_column(String(50))

    club = relationship("Club", back_populates="members")

    user_profile = relationship("UserProfile", back_populates="club_memberships")
    
    
__table_args__ = (
    UniqueConstraint(
        "club_id",
        "user_profile_id",
        name="uq_club_member",
    ),
)