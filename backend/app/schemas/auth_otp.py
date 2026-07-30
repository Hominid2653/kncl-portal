from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import ApplicationStatus, OtpPurpose


class OtpRequest(BaseModel):
    email: EmailStr
    purpose: OtpPurpose


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    purpose: OtpPurpose


class OtpVerifyResponse(BaseModel):
    email_verification_token: str
    expires_in: int


class ApplicationStatusItem(BaseModel):
    id: str
    status: ApplicationStatus
    rejection_reason: str | None = None
    submitted_at: datetime
    reviewed_at: datetime | None = None


class ClubApplicationStatusItem(ApplicationStatusItem):
    club_name: str


class PlayerApplicationStatusItem(ApplicationStatusItem):
    first_name: str
    last_name: str


class ApplicationStatusResponse(BaseModel):
    email: str
    club_application: ClubApplicationStatusItem | None = None
    player_application: PlayerApplicationStatusItem | None = None
