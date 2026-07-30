"""onboarding otp foundation

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-30 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

application_status = postgresql.ENUM(
    "PENDING",
    "APPROVED",
    "REJECTED",
    name="applicationstatus",
    create_type=False,
)
otp_purpose = postgresql.ENUM(
    "APPLICATION_SUBMIT",
    "STATUS_LOOKUP",
    name="otppurpose",
    create_type=False,
)
transfer_source = postgresql.ENUM(
    "ENGAGEMENT",
    "PLAYER_REQUEST",
    "COORDINATOR_MANUAL",
    name="transfersource",
    create_type=False,
)


def _create_enums() -> None:
    bind = op.get_bind()
    postgresql.ENUM(
        "PENDING",
        "APPROVED",
        "REJECTED",
        name="applicationstatus",
    ).create(bind, checkfirst=True)
    postgresql.ENUM(
        "APPLICATION_SUBMIT",
        "STATUS_LOOKUP",
        name="otppurpose",
    ).create(bind, checkfirst=True)
    postgresql.ENUM(
        "ENGAGEMENT",
        "PLAYER_REQUEST",
        "COORDINATOR_MANUAL",
        name="transfersource",
    ).create(bind, checkfirst=True)


def upgrade() -> None:
    _create_enums()

    op.alter_column(
        "seasons",
        "registration_open",
        new_column_name="roster_enrollment_open",
    )

    op.add_column(
        "clubs",
        sa.Column(
            "initial_roster_period_active",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )
    op.add_column(
        "clubs",
        sa.Column(
            "approved_roster_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )

    op.add_column(
        "user_profiles",
        sa.Column("coordinator_league_ids", sa.ARRAY(sa.UUID()), nullable=True),
    )

    op.add_column(
        "transfers",
        sa.Column(
            "source",
            transfer_source,
            server_default="COORDINATOR_MANUAL",
            nullable=False,
        ),
    )
    op.add_column("transfers", sa.Column("player_id", sa.UUID(), nullable=True))
    op.add_column("transfers", sa.Column("engagement_id", sa.UUID(), nullable=True))
    op.add_column(
        "transfers",
        sa.Column("submitted_by_user_profile_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        op.f("fk_transfers_player_id_players"),
        "transfers",
        "players",
        ["player_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        op.f("fk_transfers_submitted_by_user_profile_id_user_profiles"),
        "transfers",
        "user_profiles",
        ["submitted_by_user_profile_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "email_verifications",
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("purpose", otp_purpose, nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.PrimaryKeyConstraint("id", name=op.f("pk_email_verifications")),
    )
    op.create_index(
        "ix_email_verifications_email_purpose",
        "email_verifications",
        ["email", "purpose"],
        unique=False,
    )

    op.create_table(
        "club_captain_applications",
        sa.Column("club_name", sa.String(length=150), nullable=False),
        sa.Column("county", sa.String(length=100), nullable=False),
        sa.Column("league_id", sa.UUID(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("captain_first_name", sa.String(length=100), nullable=False),
        sa.Column("captain_last_name", sa.String(length=100), nullable=False),
        sa.Column("captain_email", sa.String(length=255), nullable=False),
        sa.Column("captain_phone", sa.String(length=20), nullable=False),
        sa.Column("status", application_status, server_default="PENDING", nullable=False),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by_id", sa.UUID(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_club_id", sa.UUID(), nullable=True),
        sa.Column("created_captain_id", sa.UUID(), nullable=True),
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
            ["created_captain_id"],
            ["user_profiles.id"],
            name=op.f("fk_club_captain_applications_created_captain_id_user_profiles"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["created_club_id"],
            ["clubs.id"],
            name=op.f("fk_club_captain_applications_created_club_id_clubs"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["league_id"],
            ["leagues.id"],
            name=op.f("fk_club_captain_applications_league_id_leagues"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by_id"],
            ["user_profiles.id"],
            name=op.f("fk_club_captain_applications_reviewed_by_id_user_profiles"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_club_captain_applications")),
    )
    op.create_index(
        "ix_club_captain_applications_captain_email",
        "club_captain_applications",
        ["captain_email"],
        unique=False,
    )
    op.create_index(
        "ix_club_captain_applications_status",
        "club_captain_applications",
        ["status"],
        unique=False,
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_club_captain_pending_email
        ON club_captain_applications (captain_email)
        WHERE status = 'PENDING'
        """
    )

    op.create_table(
        "player_profile_applications",
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("county", sa.String(length=100), nullable=False),
        sa.Column("nationality", sa.String(length=100), nullable=False),
        sa.Column("status", application_status, server_default="PENDING", nullable=False),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("federation_id", sa.String(length=50), nullable=True),
        sa.Column("created_player_id", sa.UUID(), nullable=True),
        sa.Column("reviewed_by_id", sa.UUID(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
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
            ["created_player_id"],
            ["players.id"],
            name=op.f("fk_player_profile_applications_created_player_id_players"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by_id"],
            ["user_profiles.id"],
            name=op.f("fk_player_profile_applications_reviewed_by_id_user_profiles"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_player_profile_applications")),
    )
    op.create_index(
        "ix_player_profile_applications_email",
        "player_profile_applications",
        ["email"],
        unique=False,
    )
    op.create_index(
        "ix_player_profile_applications_status",
        "player_profile_applications",
        ["status"],
        unique=False,
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_player_profile_pending_email
        ON player_profile_applications (email)
        WHERE status = 'PENDING'
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_player_profile_pending_email")
    op.drop_index("ix_player_profile_applications_status", table_name="player_profile_applications")
    op.drop_index("ix_player_profile_applications_email", table_name="player_profile_applications")
    op.drop_table("player_profile_applications")

    op.execute("DROP INDEX IF EXISTS uq_club_captain_pending_email")
    op.drop_index("ix_club_captain_applications_status", table_name="club_captain_applications")
    op.drop_index("ix_club_captain_applications_captain_email", table_name="club_captain_applications")
    op.drop_table("club_captain_applications")

    op.drop_index("ix_email_verifications_email_purpose", table_name="email_verifications")
    op.drop_table("email_verifications")

    op.drop_constraint(
        op.f("fk_transfers_submitted_by_user_profile_id_user_profiles"),
        "transfers",
        type_="foreignkey",
    )
    op.drop_constraint(op.f("fk_transfers_player_id_players"), "transfers", type_="foreignkey")
    op.drop_column("transfers", "submitted_by_user_profile_id")
    op.drop_column("transfers", "engagement_id")
    op.drop_column("transfers", "player_id")
    op.drop_column("transfers", "source")

    op.drop_column("user_profiles", "coordinator_league_ids")
    op.drop_column("clubs", "approved_roster_count")
    op.drop_column("clubs", "initial_roster_period_active")

    op.alter_column(
        "seasons",
        "roster_enrollment_open",
        new_column_name="registration_open",
    )

    bind = op.get_bind()
    postgresql.ENUM(name="transfersource").drop(bind, checkfirst=True)
    postgresql.ENUM(name="otppurpose").drop(bind, checkfirst=True)
    postgresql.ENUM(name="applicationstatus").drop(bind, checkfirst=True)