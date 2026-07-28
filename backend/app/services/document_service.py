from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
from app.schemas.document import DocumentCreate
from app.services.base_services import BaseService


class DocumentService(BaseService[Document]):
    def __init__(self):
        super().__init__(DocumentRepository())

    async def create(self, db, data: DocumentCreate):
        document = Document(**data.model_dump())
        return await super().create(db, document)
