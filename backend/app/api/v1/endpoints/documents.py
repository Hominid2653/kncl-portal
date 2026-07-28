from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.document import DocumentCreate, DocumentListResponse, DocumentResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix='/documents', tags=['Documents'])
service = DocumentService()


@router.get('/', response_model=DocumentListResponse, summary='List documents')
async def list_documents(db: AsyncSession = Depends(get_db)):
    documents = await service.list(db)
    return {'items': documents, 'total': len(documents)}


@router.post('/', response_model=DocumentResponse, summary='Create document', status_code=201)
async def create_document(
    payload: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
