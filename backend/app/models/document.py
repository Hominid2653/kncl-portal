from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Document(BaseModel):
    __tablename__ = "documents"

    transfer_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("transfers.id", ondelete="CASCADE"),
        nullable=False,
    )

    uploaded_by: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    document_type: Mapped[str | None] = mapped_column(String(100))

    file_name: Mapped[str | None] = mapped_column(String(255))

    file_url: Mapped[str | None] = mapped_column(Text)

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    transfer = relationship(
        "Transfer",
        back_populates="documents",
    )