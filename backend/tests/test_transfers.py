from app.services.transfer_service import TransferService


def test_transfer_service_is_available() -> None:
    assert TransferService is not None
