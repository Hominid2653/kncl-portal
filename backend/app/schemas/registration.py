from datetime import datetime
from pydantic import BaseModel

from app.models.enums import RegistrationStatus
from app.schemas.common import ListResponse, TimestampSchema


class RegistrationCreate(BaseModel):
    player_id: str
    club_id: str
    season_id: str
    status: RegistrationStatus
    registered_at: datetime


class RegistrationUpdate(BaseModel):
    status: RegistrationStatus | None = None


class RegistrationResponse(TimestampSchema):
    player_id: str
    club_id: str
    season_id: str
    status: RegistrationStatus
    registered_at: datetime


class RegistrationListResponse(ListResponse):
    items: list[RegistrationResponse]
