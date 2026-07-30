from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import (
    EngagementRecipientType,
    EngagementStatus,
    PlayerCommitmentStatus,
)


class PlayerEngagement(BaseModel):
    __tablename__ = "player_engagements"

    __table_args__ = (
        Index("ix_player_engagements_player_status", "player_id", "status"),
        Index("ix_player_engagements_recipient_club_status", "recipient_club_id", "status"),
        Index("ix_player_engagements_requesting_club_status", "requesting_club_id", "status"),
    )

    player_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("players.id", ondelete="CASCADE"),
        nullable=False,
    )
    requesting_club_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        nullable=False,
    )
    requesting_captain_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    recipient_type: Mapped[EngagementRecipientType] = mapped_column(
        Enum(EngagementRecipientType),
        nullable=False,
    )
    recipient_club_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="SET NULL"),
    )
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[EngagementStatus] = mapped_column(
        Enum(EngagementStatus),
        default=EngagementStatus.PENDING,
        nullable=False,
    )
    player_commitment_status: Mapped[PlayerCommitmentStatus] = mapped_column(
        Enum(PlayerCommitmentStatus),
        nullable=False,
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    player = relationship("Player", foreign_keys=[player_id])
    requesting_club = relationship("Club", foreign_keys=[requesting_club_id])
    recipient_club = relationship("Club", foreign_keys=[recipient_club_id])
    requesting_captain = relationship("UserProfile", foreign_keys=[requesting_captain_id])
