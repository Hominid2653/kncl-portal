from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import RegistrationStatus
from app.schemas.common import ListResponse, TimestampSchema


class RegistrationCreate(BaseModel):
    player_id: UUID
    club_id: UUID
    season_id: UUID
    status: RegistrationStatus
    registered_at: datetime


class RegistrationUpdate(BaseModel):
    status: RegistrationStatus | None = None


class RegistrationResponse(TimestampSchema):
    player_id: UUID
    club_id: UUID
    season_id: UUID
    status: RegistrationStatus
    registered_at: datetime


class RegistrationListResponse(ListResponse):
    items: list[RegistrationResponse]
