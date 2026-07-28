from app.services.document_service import DocumentService


def test_document_service_is_available() -> None:
    assert DocumentService is not None
