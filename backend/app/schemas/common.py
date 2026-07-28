from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base schema for all API models."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class TimestampSchema(BaseSchema):
    """Schema including common database fields."""

    id: UUID
    created_at: datetime
    updated_at: datetime


class ListResponse(BaseModel):
    """Base list response."""

    total: int