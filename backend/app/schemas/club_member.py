from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class ClubMemberCreate(BaseModel):
    club_id: str
    user_profile_id: str
    position: str = Field(..., min_length=1, max_length=50)


class ClubMemberUpdate(BaseModel):
    position: str | None = Field(default=None, min_length=1, max_length=50)


class ClubMemberResponse(TimestampSchema):
    club_id: str
    user_profile_id: str
    position: str


class ClubMemberListResponse(ListResponse):
    items: list[ClubMemberResponse]
