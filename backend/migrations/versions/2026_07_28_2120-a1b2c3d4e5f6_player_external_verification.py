"""player external account verification fields

Revision ID: a1b2c3d4e5f6
Revises: d2297a0afccd
Create Date: 2026-07-28 21:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "d2297a0afccd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "players",
        sa.Column("lichess_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column(
        "players",
        sa.Column("lichess_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("players", sa.Column("lichess_user_id", sa.String(length=100), nullable=True))
    op.add_column(
        "players",
        sa.Column("lichess_verification_code", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "players",
        sa.Column("chesscom_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column(
        "players",
        sa.Column("chesscom_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "players",
        sa.Column("chesscom_verification_code", sa.String(length=32), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("players", "chesscom_verification_code")
    op.drop_column("players", "chesscom_verified_at")
    op.drop_column("players", "chesscom_verified")
    op.drop_column("players", "lichess_verification_code")
    op.drop_column("players", "lichess_user_id")
    op.drop_column("players", "lichess_verified_at")
    op.drop_column("players", "lichess_verified")
