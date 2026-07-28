from datetime import date
from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class PlayerCreate(BaseModel):
    user_profile_id: str
    federation_id: str | None = Field(default=None, max_length=50)
    fide_id: str | None = Field(default=None, max_length=50)
    chesscom_username: str | None = Field(default=None, max_length=100)
    lichess_username: str | None = Field(default=None, max_length=100)
    rapid_rating: int | None = None
    blitz_rating: int | None = None
    classical_rating: int | None = None
    nationality: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    profile_photo: str | None = None


class PlayerUpdate(BaseModel):
    federation_id: str | None = Field(default=None, max_length=50)
    fide_id: str | None = Field(default=None, max_length=50)
    chesscom_username: str | None = Field(default=None, max_length=100)
    lichess_username: str | None = Field(default=None, max_length=100)
    rapid_rating: int | None = None
    blitz_rating: int | None = None
    classical_rating: int | None = None
    nationality: str | None = Field(default=None, max_length=100)
    date_of_birth: date | None = None
    profile_photo: str | None = None


class PlayerResponse(TimestampSchema):
    user_profile_id: str
    federation_id: str | None = None
    fide_id: str | None = None
    chesscom_username: str | None = None
    lichess_username: str | None = None
    rapid_rating: int | None = None
    blitz_rating: int | None = None
    classical_rating: int | None = None
    nationality: str | None = None
    date_of_birth: date | None = None
    profile_photo: str | None = None


class PlayerListResponse(ListResponse):
    items: list[PlayerResponse]
