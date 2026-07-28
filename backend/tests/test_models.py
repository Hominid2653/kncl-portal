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


def test_critical_foreign_keys_use_database_cascades() -> None:
    models_and_columns = {
        Registration: ("player_id", "club_id", "season_id"),
        Transfer: ("registration_id", "from_club_id", "to_club_id"),
        Document: ("transfer_id", "uploaded_by"),
        ClubMember: ("club_id", "user_profile_id"),
    }

    for model, column_names in models_and_columns.items():
        for column_name in column_names:
            foreign_key = next(iter(model.__table__.c[column_name].foreign_keys))
            assert foreign_key.ondelete == "CASCADE"


def test_league_name_is_a_typed_mapped_column() -> None:
    assert League.__table__.c.name.nullable is False
