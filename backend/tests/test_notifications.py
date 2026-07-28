from app.services.notification_service import NotificationService


def test_notification_service_is_available() -> None:
    assert NotificationService is not None
