from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.enums import UserRole


class AuthSessionResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    role: UserRole
    club_id: UUID | None = None
    club_name: str | None = None
    player_id: UUID | None = None
    league_ids: list[UUID] = Field(default_factory=list)


class PasswordResetRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=320)


class PasswordResetConfirm(BaseModel):
    password: str = Field(..., min_length=8, max_length=128)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def new_password_must_differ(cls, value: str, info) -> str:
        current = info.data.get("current_password")
        if current and value == current:
            raise ValueError("New password must be different from your current password.")
        return value
