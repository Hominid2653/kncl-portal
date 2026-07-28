from pydantic import BaseModel, Field

from app.models.enums import UserRole
from app.schemas.common import ListResponse, TimestampSchema


class UserProfileCreate(BaseModel):
    auth_user_id: str
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    role: UserRole


class UserProfileUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    role: UserRole | None = None


class UserProfileResponse(TimestampSchema):
    auth_user_id: str
    first_name: str
    last_name: str
    phone: str | None = None
    role: UserRole


class UserProfileListResponse(ListResponse):
    items: list[UserProfileResponse]
