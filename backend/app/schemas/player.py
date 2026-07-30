from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class PlayerCreate(BaseModel):
    user_profile_id: UUID
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


class PlayerExternalAccountUpdate(BaseModel):
    """Player self-service or club-admin linking of external platform accounts."""

    fide_id: str | None = Field(default=None, max_length=50)
    lichess_username: str | None = Field(default=None, max_length=100)
    chesscom_username: str | None = Field(default=None, max_length=100)


class PlayerResponse(TimestampSchema):
    user_profile_id: UUID
    federation_id: str | None = None
    fide_id: str | None = None
    chesscom_username: str | None = None
    lichess_username: str | None = None
    lichess_verified: bool = False
    lichess_verified_at: datetime | None = None
    chesscom_verified: bool = False
    chesscom_verified_at: datetime | None = None
    rapid_rating: int | None = None
    blitz_rating: int | None = None
    classical_rating: int | None = None
    nationality: str | None = None
    date_of_birth: date | None = None
    profile_photo: str | None = None


class PlayerListResponse(ListResponse):
    items: list[PlayerResponse]
