from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import TransferStatus



class Transfer(BaseModel):
    __tablename__ = "transfers"

    __table_args__ = (
        Index("ix_transfer_status", "status"),
    )

    registration_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("registrations.id", ondelete="CASCADE"),
        nullable=False,
    )

    from_club_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="RESTRICT"),
        nullable=False,
    )

    to_club_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="RESTRICT"),
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(Text)

    status: Mapped[TransferStatus] = mapped_column(
        Enum(TransferStatus),
        nullable=False,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    registration = relationship(
        "Registration",
        back_populates="transfers",
    )

    from_club = relationship(
        "Club",
        foreign_keys=[from_club_id],
        back_populates="outgoing_transfers",
    )

    to_club = relationship(
        "Club",
        foreign_keys=[to_club_id],
        back_populates="incoming_transfers",
    )

    approvals = relationship(
        "TransferApproval",
        back_populates="transfer",
        cascade="all, delete-orphan",
    )

    documents = relationship(
        "Document",
        back_populates="transfer",
        cascade="all, delete-orphan",
    )
