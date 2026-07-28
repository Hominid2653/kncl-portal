from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import TransferStatus


class Transfer(BaseModel):
    __tablename__ = "transfers"

    registration_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("registrations.id"),
        nullable=False,
    )

    from_club_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id"),
        nullable=False,
    )

    to_club_id: Mapped[PG_UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("clubs.id"),
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
    )

    documents = relationship(
        "Document",
        back_populates="transfer",
    )