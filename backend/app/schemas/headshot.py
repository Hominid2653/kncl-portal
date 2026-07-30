from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.models.enums import HeadshotSource
from app.schemas.common import ListResponse


class HeadshotUpdate(BaseModel):
    headshot_url: HttpUrl
    headshot_source: HeadshotSource = HeadshotSource.URL


class HeadshotModerationUpdate(BaseModel):
    headshot_moderation_status: str = Field(..., pattern="^(APPROVED|REJECTED|PENDING)$")


class HeadshotResponse(BaseModel):
    player_id: UUID
    headshot_url: str | None = None
    headshot_source: HeadshotSource | None = None
    headshot_moderation_status: str
    headshot_updated_at: datetime | None = None


class PendingHeadshotItem(BaseModel):
    player_id: UUID
    player_name: str
    headshot_url: str | None = None
    league_id: UUID | None = None
    headshot_updated_at: datetime | None = None


class PendingHeadshotListResponse(ListResponse):
    items: list[PendingHeadshotItem]
