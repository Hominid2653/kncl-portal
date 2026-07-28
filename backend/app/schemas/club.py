from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class ClubCreate(BaseModel):
    league_id: str
    name: str = Field(..., min_length=3, max_length=150)
    county: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    logo: str | None = Field(default=None, max_length=1000)
    founded_year: int | None = None


class ClubUpdate(BaseModel):
    league_id: str | None = None
    name: str | None = Field(default=None, min_length=3, max_length=150)
    county: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    logo: str | None = Field(default=None, max_length=1000)
    founded_year: int | None = None


class ClubResponse(TimestampSchema):
    league_id: str
    name: str
    county: str | None = None
    description: str | None = None
    logo: str | None = None
    founded_year: int | None = None


class ClubListResponse(ListResponse):
    items: list[ClubResponse]
