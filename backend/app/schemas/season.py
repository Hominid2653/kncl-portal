from datetime import date
from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class SeasonCreate(BaseModel):
    league_id: str
    name: str = Field(..., min_length=3, max_length=100)
    year: int
    registration_open: bool = False
    transfers_open: bool = False
    start_date: date | None = None
    end_date: date | None = None


class SeasonUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=100)
    registration_open: bool | None = None
    transfers_open: bool | None = None
    start_date: date | None = None
    end_date: date | None = None


class SeasonResponse(TimestampSchema):
    league_id: str
    name: str
    year: int
    registration_open: bool
    transfers_open: bool
    start_date: date | None = None
    end_date: date | None = None


class SeasonListResponse(ListResponse):
    items: list[SeasonResponse]
