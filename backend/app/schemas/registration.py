from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import RegistrationStatus
from app.schemas.common import ListResponse, TimestampSchema


class RegistrationCreate(BaseModel):
    """Submit a registration. Status and timestamp are set by the server."""

    player_id: UUID
    club_id: UUID
    season_id: UUID


class RegistrationAction(BaseModel):
    remarks: str | None = None


class RegistrationResponse(TimestampSchema):
    player_id: UUID
    club_id: UUID
    season_id: UUID
    status: RegistrationStatus
    registered_at: datetime


class RegistrationListResponse(ListResponse):
    items: list[RegistrationResponse]
