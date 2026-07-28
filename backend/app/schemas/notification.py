from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class NotificationCreate(BaseModel):
    user_profile_id: UUID
    title: str = Field(..., max_length=255)
    message: str = Field(...)
    is_read: bool = False


class NotificationUpdate(BaseModel):
    is_read: bool | None = None


class NotificationResponse(TimestampSchema):
    user_profile_id: UUID
    title: str
    message: str
    is_read: bool


class NotificationListResponse(ListResponse):
    items: list[NotificationResponse]
