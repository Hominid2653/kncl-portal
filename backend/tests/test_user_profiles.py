from app.services.user_profile_service import UserProfileService


def test_user_profile_service_is_available() -> None:
    assert UserProfileService is not None
