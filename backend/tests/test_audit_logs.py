from app.services.audit_log_service import AuditLogService


def test_audit_log_service_is_available() -> None:
    assert AuditLogService is not None
