from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import TransferStatus
from app.schemas.common import ListResponse, TimestampSchema


class TransferCreate(BaseModel):
    registration_id: UUID
    from_club_id: UUID
    to_club_id: UUID
    reason: str | None = None
    status: TransferStatus
    submitted_at: datetime
    completed_at: datetime | None = None


class TransferUpdate(BaseModel):
    status: TransferStatus | None = None
    completed_at: datetime | None = None
    reason: str | None = None


class TransferResponse(TimestampSchema):
    registration_id: UUID
    from_club_id: UUID
    to_club_id: UUID
    reason: str | None = None
    status: TransferStatus
    submitted_at: datetime
    completed_at: datetime | None = None


class TransferListResponse(ListResponse):
    items: list[TransferResponse]
