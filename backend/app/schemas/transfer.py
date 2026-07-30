from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.enums import TransferSource, TransferStatus
from app.schemas.common import ListResponse, TimestampSchema


class TransferCreate(BaseModel):
    """Submit a new transfer request. Status and timestamps are set by the server."""

    registration_id: UUID | None = None
    from_club_id: UUID
    to_club_id: UUID
    reason: str | None = None
    source: TransferSource = TransferSource.COORDINATOR_MANUAL
    player_id: UUID | None = None
    engagement_id: UUID | None = None

    @model_validator(mode="after")
    def validate_registration_for_source(self):
        if self.source is TransferSource.COORDINATOR_MANUAL and not self.registration_id:
            raise ValueError("registration_id is required for coordinator manual transfers.")
        return self


class TransferUpdate(BaseModel):
    """Only the reason may be edited, and only while the transfer is pending."""

    reason: str | None = None


class TransferAction(BaseModel):
    remarks: str | None = None


class TransferPlayerRequest(BaseModel):
    from_club_id: UUID
    to_club_id: UUID
    reason: str = Field(..., min_length=1)


class TransferResponse(TimestampSchema):
    registration_id: UUID
    from_club_id: UUID
    to_club_id: UUID
    reason: str | None = None
    source: TransferSource = TransferSource.COORDINATOR_MANUAL
    player_id: UUID | None = None
    engagement_id: UUID | None = None
    submitted_by_user_profile_id: UUID | None = None
    status: TransferStatus
    submitted_at: datetime
    completed_at: datetime | None = None


class TransferListResponse(ListResponse):
    items: list[TransferResponse]
