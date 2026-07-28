from app.services.season_service import SeasonService


def test_season_service_is_available() -> None:
    assert SeasonService is not None
