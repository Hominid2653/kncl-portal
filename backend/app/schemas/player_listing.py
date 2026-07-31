from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import PlayerCommitmentStatus
from app.schemas.common import ListResponse


class PlayerListingClub(BaseModel):
    id: UUID
    name: str


class PlayerListingItem(BaseModel):
    id: UUID
    federation_id: str | None = None
    name: str
    commitment_status: PlayerCommitmentStatus
    club: PlayerListingClub | None = None
    county: str | None = None
    fide_id: str | None = None
    fide_rating: int | None = None
    blitz_rating: int | None = None
    rapid_rating: int | None = None
    classical_rating: int | None = None
    lichess_username: str | None = None
    chesscom_username: str | None = None
    lichess_verified: bool = False
    chesscom_verified: bool = False
    nationality: str | None = None
    headshot_url: str | None = None
    last_active: datetime | None = None


class PlayerListingResponse(ListResponse):
    items: list[PlayerListingItem]
