from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import TransferStatus
from app.schemas.common import ListResponse, TimestampSchema


class TransferCreate(BaseModel):
    """Submit a new transfer request. Status and timestamps are set by the server."""

    registration_id: UUID
    from_club_id: UUID
    to_club_id: UUID
    reason: str | None = None


class TransferUpdate(BaseModel):
    """Only the reason may be edited, and only while the transfer is pending."""

    reason: str | None = None


class TransferAction(BaseModel):
    remarks: str | None = None


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
