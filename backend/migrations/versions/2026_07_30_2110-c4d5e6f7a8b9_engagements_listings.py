"""engagements and listings foundation

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-07-30 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

player_commitment_status = postgresql.ENUM(
    "FREE_AGENT",
    "COMMITTED",
    name="playercommitmentstatus",
    create_type=False,
)
engagement_status = postgresql.ENUM(
    "PENDING",
    "ACCEPTED",
    "DECLINED",
    "WITHDRAWN",
    name="engagementstatus",
    create_type=False,
)
engagement_recipient_type = postgresql.ENUM(
    "PLAYER",
    "CLUB_CAPTAIN",
    name="engagementrecipienttype",
    create_type=False,
)
headshot_source = postgresql.ENUM(
    "UPLOAD",
    "URL",
    "EXTERNAL",
    name="headshotsource",
    create_type=False,
)


def _create_enums() -> None:
    bind = op.get_bind()
    postgresql.ENUM("FREE_AGENT", "COMMITTED", name="playercommitmentstatus").create(bind, checkfirst=True)
    postgresql.ENUM(
        "PENDING",
        "ACCEPTED",
        "DECLINED",
        "WITHDRAWN",
        name="engagementstatus",
    ).create(bind, checkfirst=True)
    postgresql.ENUM("PLAYER", "CLUB_CAPTAIN", name="engagementrecipienttype").create(bind, checkfirst=True)
    postgresql.ENUM("UPLOAD", "URL", "EXTERNAL", name="headshotsource").create(bind, checkfirst=True)


def upgrade() -> None:
    _create_enums()

    op.add_column("players", sa.Column("headshot_url", sa.String(length=500), nullable=True))
    op.add_column("players", sa.Column("headshot_source", headshot_source, nullable=True))
    op.add_column(
        "players",
        sa.Column("headshot_updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "players",
        sa.Column(
            "headshot_moderation_status",
            sa.String(length=20),
            server_default="APPROVED",
            nullable=False,
        ),
    )

    op.add_column("notifications", sa.Column("engagement_id", sa.UUID(), nullable=True))

    op.create_table(
        "player_engagements",
        sa.Column("player_id", sa.UUID(), nullable=False),
        sa.Column("requesting_club_id", sa.UUID(), nullable=False),
        sa.Column("requesting_captain_id", sa.UUID(), nullable=False),
        sa.Column("recipient_type", engagement_recipient_type, nullable=False),
        sa.Column("recipient_club_id", sa.UUID(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", engagement_status, server_default="PENDING", nullable=False),
        sa.Column("player_commitment_status", player_commitment_status, nullable=False),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["player_id"],
            ["players.id"],
            name=op.f("fk_player_engagements_player_id_players"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["recipient_club_id"],
            ["clubs.id"],
            name=op.f("fk_player_engagements_recipient_club_id_clubs"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["requesting_captain_id"],
            ["user_profiles.id"],
            name=op.f("fk_player_engagements_requesting_captain_id_user_profiles"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["requesting_club_id"],
            ["clubs.id"],
            name=op.f("fk_player_engagements_requesting_club_id_clubs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_player_engagements")),
    )
    op.create_index("ix_player_engagements_player_status", "player_engagements", ["player_id", "status"])
    op.create_index(
        "ix_player_engagements_recipient_club_status",
        "player_engagements",
        ["recipient_club_id", "status"],
    )
    op.create_index(
        "ix_player_engagements_requesting_club_status",
        "player_engagements",
        ["requesting_club_id", "status"],
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_player_engagement_pending
        ON player_engagements (requesting_club_id, player_id)
        WHERE status = 'PENDING'
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_player_engagement_pending")
    op.drop_index("ix_player_engagements_requesting_club_status", table_name="player_engagements")
    op.drop_index("ix_player_engagements_recipient_club_status", table_name="player_engagements")
    op.drop_index("ix_player_engagements_player_status", table_name="player_engagements")
    op.drop_table("player_engagements")

    op.drop_column("notifications", "engagement_id")
    op.drop_column("players", "headshot_moderation_status")
    op.drop_column("players", "headshot_updated_at")
    op.drop_column("players", "headshot_source")
    op.drop_column("players", "headshot_url")

    bind = op.get_bind()
    postgresql.ENUM(name="headshotsource").drop(bind, checkfirst=True)
    postgresql.ENUM(name="engagementrecipienttype").drop(bind, checkfirst=True)
    postgresql.ENUM(name="engagementstatus").drop(bind, checkfirst=True)
    postgresql.ENUM(name="playercommitmentstatus").drop(bind, checkfirst=True)
