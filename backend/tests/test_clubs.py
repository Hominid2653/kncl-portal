from app.services.club_service import ClubService


def test_club_service_is_available() -> None:
    assert ClubService is not None
