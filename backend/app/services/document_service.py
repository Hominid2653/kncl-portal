from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationError
from app.dependencies.auth import CurrentUser
from app.models.audit_log import AuditLog
from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
from app.repositories.transfer_repository import TransferRepository
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.base_services import BaseService
from app.services.storage_service import StorageService


class DocumentService(BaseService[Document]):
    def __init__(self, storage: StorageService | None = None) -> None:
        super().__init__(DocumentRepository())
        self.storage = storage or StorageService()
        self.transfer_repository = TransferRepository()

    async def upload(
        self,
        db: AsyncSession,
        *,
        transfer_id: UUID,
        filename: str,
        content_type: str | None,
        content: bytes,
        document_type: str | None,
        actor: CurrentUser,
    ) -> Document:
        transfer = await self.transfer_repository.get_by_id(db, transfer_id)
        if not transfer:
            from app.core.exceptions import ResourceNotFound

            raise ResourceNotFound("Transfer not found.")

        resolved_type = self.storage.validate_upload(
            filename=filename,
            content_type=content_type,
            size_bytes=len(content),
        )
        storage_path = self.storage.build_transfer_path(str(transfer_id), filename)
        await self.storage.upload(
            storage_path=storage_path,
            content=content,
            content_type=resolved_type,
        )

        now = datetime.now(timezone.utc)
        document = Document(
            transfer_id=transfer_id,
            uploaded_by=actor.id,
            document_type=document_type,
            file_name=filename,
            file_url=storage_path,
            uploaded_at=now,
        )
        db.add(document)
        await db.flush()
        db.add(
            AuditLog(
                user_profile_id=actor.id,
                action="DOCUMENT_UPLOADED",
                entity="document",
                entity_id=document.id,
            )
        )
        await db.commit()
        await db.refresh(document)
        return document

    async def register_metadata(
        self,
        db: AsyncSession,
        data: DocumentCreate,
        actor: CurrentUser,
    ) -> Document:
        transfer = await self.transfer_repository.get_by_id(db, data.transfer_id)
        if not transfer:
            from app.core.exceptions import ResourceNotFound

            raise ResourceNotFound("Transfer not found.")
        if not data.file_url.strip():
            raise ValidationError("file_url is required.")

        now = datetime.now(timezone.utc)
        document = Document(
            transfer_id=data.transfer_id,
            uploaded_by=actor.id,
            document_type=data.document_type,
            file_name=data.file_name,
            file_url=data.file_url.strip(),
            uploaded_at=now,
        )
        return await super().create(db, document)

    async def to_response(self, document: Document) -> DocumentResponse:
        download_url = None
        if document.file_url:
            try:
                download_url = await self.storage.create_signed_download_url(document.file_url)
            except ValidationError:
                download_url = document.file_url if document.file_url.startswith("http") else None

        return DocumentResponse(
            id=document.id,
            created_at=document.created_at,
            updated_at=document.updated_at,
            transfer_id=document.transfer_id,
            uploaded_by=document.uploaded_by,
            document_type=document.document_type,
            file_name=document.file_name,
            file_url=document.file_url,
            uploaded_at=document.uploaded_at,
            download_url=download_url,
        )

    async def get_download_url(self, document: Document, *, expires_in: int = 3600) -> str:
        if not document.file_url:
            raise ValidationError("Document does not have an associated file.")
        return await self.storage.create_signed_download_url(
            document.file_url,
            expires_in=expires_in,
        )

    async def delete_with_storage(self, db: AsyncSession, document_id: UUID) -> None:
        document = await self.get(db, document_id)
        if document.file_url:
            await self.storage.delete(document.file_url)
        await self.repository.delete(db, document)
