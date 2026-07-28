from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import ApprovalDecision


class TransferApproval(BaseModel):
    __tablename__ = "transfer_approvals"

    transfer_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("transfers.id", ondelete="CASCADE"),
        nullable=False,
    )

    approved_by: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    decision: Mapped[ApprovalDecision] = mapped_column(
        Enum(ApprovalDecision),
        nullable=False,
    )

    remarks: Mapped[str | None] = mapped_column(Text)

    approved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    transfer = relationship(
        "Transfer",
        back_populates="approvals",
    )