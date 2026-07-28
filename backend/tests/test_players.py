from app.services.player_service import PlayerService


def test_player_service_is_available() -> None:
    assert PlayerService is not None
