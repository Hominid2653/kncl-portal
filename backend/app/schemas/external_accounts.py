from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RatingConfidence(BaseModel):
    rating: int | None = None
    games: int = 0
    provisional: bool = False


class ExternalRatings(BaseModel):
    bullet: int | None = None
    blitz: int | None = None
    rapid: int | None = None
    classical: int | None = None


class ExternalRatingDetails(BaseModel):
    bullet: RatingConfidence | None = None
    blitz: RatingConfidence | None = None
    rapid: RatingConfidence | None = None
    classical: RatingConfidence | None = None


class RatingDrift(BaseModel):
    stored: int | None = None
    live: int | None = None
    drift: int | None = None


class ExternalAccountProfile(BaseModel):
    username: str
    external_user_id: str | None = None
    title: str | None = None
    display_name: str | None = None
    profile_url: str
    country: str | None = None
    fide_rating: int | None = None
    avatar_url: str | None = None
    ratings: ExternalRatings
    rating_details: ExternalRatingDetails
    account_created_at: datetime | None = None
    last_seen_at: datetime | None = None
    username_exists: bool = True
    portal_verified: bool = False
    portal_verified_at: datetime | None = None
    matches_stored_username: bool | None = None


class PlayerExternalAccountComparison(BaseModel):
    player_id: UUID
    platform: str
    stored_username: str | None = None
    matches_stored_username: bool
    portal_verified: bool
    portal_verified_at: datetime | None = None
    live: ExternalAccountProfile
    stored_ratings: ExternalRatings
    drift: dict[str, RatingDrift]


class VerificationCodeResponse(BaseModel):
    player_id: UUID
    platform: str
    username: str
    verification_code: str
    instructions: str


class VerificationResult(BaseModel):
    player_id: UUID
    platform: str
    username: str
    verified: bool
    verified_at: datetime | None = None
    method: str


class LichessProfile(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    country: str | None = None
    bio: str | None = None
    first_name: str | None = Field(default=None, alias="firstName")
    last_name: str | None = Field(default=None, alias="lastName")
    fide_rating: int | None = Field(default=None, alias="fideRating")
    links: str | None = None
