from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class AuditLogCreate(BaseModel):
    user_profile_id: UUID
    action: str = Field(..., max_length=255)
    entity: str = Field(..., max_length=100)
    entity_id: UUID | None = None
    ip_address: str | None = Field(default=None, max_length=50)


class AuditLogResponse(TimestampSchema):
    user_profile_id: UUID
    action: str
    entity: str
    entity_id: UUID | None = None
    ip_address: str | None = None


class AuditLogListResponse(ListResponse):
    items: list[AuditLogResponse]
