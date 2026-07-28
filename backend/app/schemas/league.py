from pydantic import BaseModel, Field

from app.schemas.common import TimestampSchema


class LeagueCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: str | None = Field(default=None, max_length=500)


class LeagueUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=150)
    description: str | None = Field(default=None, max_length=500)


class LeagueResponse(TimestampSchema):
    name: str
    description: str | None = None


class LeagueListResponse(BaseModel):
    items: list[LeagueResponse]
    total: int