from sqlalchemy import UniqueConstraint, create_engine

from app.models import (
    Base,
    Club,
    ClubMember,
    Document,
    League,
    Notification,
    Player,
    Registration,
    Season,
    Transfer,
)


def test_models_can_be_mapped_and_created() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)


def test_model_constraints_and_indexes_are_attached_to_tables() -> None:
    registration_constraints = {
        constraint.name
        for constraint in Registration.__table__.constraints
        if isinstance(constraint, UniqueConstraint)
    }

    assert registration_constraints == {"uq_player_season_registration"}
    assert {index.name for index in Registration.__table__.indexes} == {
        "ix_registration_player",
        "ix_registration_club",
    }
    assert {index.name for index in Transfer.__table__.indexes} == {"ix_transfer_status"}
    assert {index.name for index in Player.__table__.indexes} == {
        "ix_player_fide",
        "ix_player_chesscom",
        "ix_player_lichess",
    }
    assert {index.name for index in Notification.__table__.indexes} == {"ix_notification_user"}


def test_required_league_foreign_keys_are_not_nullable() -> None:
    assert Club.__table__.c.league_id.nullable is False
    assert Season.__table__.c.league_id.nullable is False


def test_named_unique_constraints_are_attached_to_their_models() -> None:
    expected_constraints = {
        Club: "uq_league_club_name",
        ClubMember: "uq_club_member",
        Season: "uq_league_year",
    }

    for model, constraint_name in expected_constraints.items():
        constraints = {
            constraint.name
            for constraint in model.__table__.constraints
            if isinstance(constraint, UniqueConstraint)
        }
        assert constraint_name in constraints


def test_critical_foreign_keys_use_expected_delete_policies() -> None:
    expected_policies = {
        Registration: {"player_id": "CASCADE", "club_id": "CASCADE", "season_id": "CASCADE"},
        Transfer: {
            "registration_id": "CASCADE",
            "from_club_id": "RESTRICT",
            "to_club_id": "RESTRICT",
        },
        Document: {"transfer_id": "CASCADE", "uploaded_by": "CASCADE"},
        ClubMember: {"club_id": "CASCADE", "user_profile_id": "CASCADE"},
    }

    for model, policies in expected_policies.items():
        for column_name, expected_policy in policies.items():
            foreign_key = next(iter(model.__table__.c[column_name].foreign_keys))
            assert foreign_key.ondelete == expected_policy


def test_league_name_is_a_typed_mapped_column() -> None:
    assert League.__table__.c.name.nullable is False
