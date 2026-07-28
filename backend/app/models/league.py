from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class League(BaseModel):
    __tablename__ = "leagues"

    name = mapped_column(
    String(150),
    unique=True,
    nullable=False,
)
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    clubs = relationship(
    "Club",
    back_populates="league",
    cascade="all, delete-orphan",
    )

    seasons = relationship(
        "Season",
        back_populates="league",
        cascade="all, delete-orphan",
    )