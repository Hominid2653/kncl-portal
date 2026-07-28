from app.services.transfer_approval_service import TransferApprovalService


def test_transfer_approval_service_is_available() -> None:
    assert TransferApprovalService is not None
