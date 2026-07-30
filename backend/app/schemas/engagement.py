from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import (
    EngagementRecipientType,
    EngagementStatus,
    PlayerCommitmentStatus,
)
from app.schemas.common import ListResponse, TimestampSchema


class EngagementCreate(BaseModel):
    player_id: UUID
    message: str = Field(..., min_length=1, max_length=2000)


class EngagementUpdate(BaseModel):
    status: EngagementStatus | None = None


class EngagementResponse(TimestampSchema):
    player_id: UUID
    requesting_club_id: UUID
    requesting_captain_id: UUID
    recipient_type: EngagementRecipientType
    recipient_club_id: UUID | None = None
    message: str | None = None
    status: EngagementStatus
    player_commitment_status: PlayerCommitmentStatus
    responded_at: datetime | None = None


class EngagementListResponse(ListResponse):
    items: list[EngagementResponse]
