from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ValidationInfo, field_validator

from app.models.enums import ApplicationStatus
from app.schemas.common import ListResponse, TimestampSchema


class ClubCaptainApplicationCreate(BaseModel):
    club_name: str = Field(..., min_length=2, max_length=150)
    county: str = Field(..., min_length=2, max_length=100)
    league_id: UUID
    description: str | None = Field(default=None, max_length=2000)
    captain_first_name: str = Field(..., min_length=1, max_length=100)
    captain_last_name: str = Field(..., min_length=1, max_length=100)
    captain_email: EmailStr
    captain_phone: str = Field(..., min_length=7, max_length=20)


class PlayerProfileApplicationCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    county: str = Field(..., min_length=2, max_length=100)
    nationality: str = Field(..., min_length=2, max_length=100)
    league_id: UUID | None = None


class ApplicationReview(BaseModel):
    status: ApplicationStatus
    rejection_reason: str | None = Field(default=None, max_length=2000)

    @field_validator("status")
    @classmethod
    def status_must_be_terminal(cls, value: ApplicationStatus) -> ApplicationStatus:
        if value is ApplicationStatus.PENDING:
            raise ValueError("Review status must be APPROVED or REJECTED.")
        return value

    @field_validator("rejection_reason")
    @classmethod
    def rejection_reason_required_when_rejected(
        cls,
        value: str | None,
        info: ValidationInfo,
    ) -> str | None:
        status = info.data.get("status")
        if status is ApplicationStatus.REJECTED and not (value and value.strip()):
            raise ValueError("rejection_reason is required when status is REJECTED.")
        return value.strip() if value else value


class ClubCaptainApplicationResponse(TimestampSchema):
    club_name: str
    county: str
    league_id: UUID
    league_name: str | None = None
    description: str | None = None
    captain_first_name: str
    captain_last_name: str
    captain_email: str
    captain_phone: str
    status: ApplicationStatus
    rejection_reason: str | None = None
    email_verified_at: datetime | None = None
    reviewed_by_id: UUID | None = None
    reviewed_at: datetime | None = None
    created_club_id: UUID | None = None
    created_captain_id: UUID | None = None


class PlayerProfileApplicationResponse(TimestampSchema):
    first_name: str
    last_name: str
    email: str
    county: str
    nationality: str
    status: ApplicationStatus
    rejection_reason: str | None = None
    email_verified_at: datetime | None = None
    federation_id: str | None = None
    reviewed_by_id: UUID | None = None
    reviewed_at: datetime | None = None
    created_player_id: UUID | None = None


class ClubCaptainApplicationListResponse(ListResponse):
    items: list[ClubCaptainApplicationResponse]


class PlayerProfileApplicationListResponse(ListResponse):
    items: list[PlayerProfileApplicationResponse]


class CoordinatorCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    league_ids: list[UUID] = Field(default_factory=list)


class CoordinatorResponse(TimestampSchema):
    auth_user_id: UUID
    first_name: str
    last_name: str
    phone: str | None = None
    role: str
    coordinator_league_ids: list[UUID] | None = None
