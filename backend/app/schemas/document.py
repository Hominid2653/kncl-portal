from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ListResponse, TimestampSchema


class DocumentCreate(BaseModel):
    """Register document metadata when the file already exists in storage."""

    transfer_id: UUID
    document_type: str | None = Field(default=None, max_length=100)
    file_name: str | None = Field(default=None, max_length=255)
    file_url: str


class DocumentUpdate(BaseModel):
    document_type: str | None = Field(default=None, max_length=100)
    file_name: str | None = Field(default=None, max_length=255)


class DocumentResponse(TimestampSchema):
    transfer_id: UUID
    uploaded_by: UUID
    document_type: str | None = None
    file_name: str | None = None
    file_url: str | None = None
    uploaded_at: datetime
    download_url: str | None = None


class DocumentDownloadResponse(BaseModel):
    download_url: str
    expires_in: int


class DocumentListResponse(ListResponse):
    items: list[DocumentResponse]
