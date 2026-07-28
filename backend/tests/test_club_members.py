from app.services.club_member_service import ClubMemberService


def test_club_member_service_is_available() -> None:
    assert ClubMemberService is not None
