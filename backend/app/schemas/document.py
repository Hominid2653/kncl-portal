from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class DocumentCreate(BaseModel):
    transfer_id: str
    uploaded_by: str
    document_type: str | None = Field(default=None, max_length=100)
    file_name: str | None = Field(default=None, max_length=255)
    file_url: str | None = None
    uploaded_at: datetime


class DocumentUpdate(BaseModel):
    document_type: str | None = Field(default=None, max_length=100)
    file_name: str | None = Field(default=None, max_length=255)
    file_url: str | None = None


class DocumentResponse(TimestampSchema):
    transfer_id: str
    uploaded_by: str
    document_type: str | None = None
    file_name: str | None = None
    file_url: str | None = None
    uploaded_at: datetime


class DocumentListResponse(ListResponse):
    items: list[DocumentResponse]
