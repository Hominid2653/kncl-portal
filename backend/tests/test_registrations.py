from app.services.registration_service import RegistrationService


def test_registration_service_is_available() -> None:
    assert RegistrationService is not None
