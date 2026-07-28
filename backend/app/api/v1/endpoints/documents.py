from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import (
    CurrentUser,
    require_authenticated,
    require_club_leadership,
)
from app.dependencies.dependencies import get_db
from app.schemas.document import (
    DocumentCreate,
    DocumentDownloadResponse,
    DocumentListResponse,
    DocumentResponse,
    DocumentUpdate,
)
from app.services.authorization_service import AuthorizationService
from app.services.document_service import DocumentService

router = APIRouter(prefix='/documents', tags=['Documents'])
service = DocumentService()
authz = AuthorizationService()


@router.get('/', response_model=DocumentListResponse, summary='List Documents')
async def list_document(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
    page: int = Query(1, ge=1, description='Page number'),
    page_size: int = Query(20, ge=1, le=100, description='Items per page'),
    sort_by: str | None = Query(None, description='Field to sort by'),
    sort_order: str = Query('asc', pattern='^(asc|desc)$', description='Sort direction'),
    search: str | None = Query(None, description='Search term'),
    filter: list[str] | None = Query(default=None, alias='filter', description='Filter as field=value'),
):
    filters = parse_filters(filter)
    filters = await authz.scope_document_filters(db, current_user, filters)
    result = await service.list(
        db,
        filters=filters,
        search=search,
        search_fields=['document_type', 'file_name', 'file_url'],
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    items = [await service.to_response(item) for item in result["items"]]
    return {"items": items, "total": result["total"]}


@router.post(
    '/upload',
    response_model=DocumentResponse,
    summary='Upload Document',
    status_code=201,
)
async def upload_document(
    transfer_id: UUID = Form(...),
    document_type: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    from app.repositories.transfer_repository import TransferRepository

    transfer = await TransferRepository().get_by_id(db, transfer_id)
    if not transfer:
        from app.core.exceptions import ResourceNotFound

        raise ResourceNotFound("Transfer not found.")
    await authz.ensure_can_read_transfer(db, current_user, transfer)

    content = await file.read()
    document = await service.upload(
        db,
        transfer_id=transfer_id,
        filename=file.filename or "upload.bin",
        content_type=file.content_type,
        content=content,
        document_type=document_type,
        actor=current_user,
    )
    return await service.to_response(document)


@router.post('/', response_model=DocumentResponse, summary='Register Document metadata', status_code=201)
async def create_document(
    payload: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    from app.repositories.transfer_repository import TransferRepository

    transfer = await TransferRepository().get_by_id(db, payload.transfer_id)
    if not transfer:
        from app.core.exceptions import ResourceNotFound

        raise ResourceNotFound("Transfer not found.")
    await authz.ensure_can_read_transfer(db, current_user, transfer)
    document = await service.register_metadata(db, payload, current_user)
    return await service.to_response(document)


@router.get(
    '/{item_id}/download-url',
    response_model=DocumentDownloadResponse,
    summary='Get signed download URL',
)
async def get_document_download_url(
    item_id: UUID,
    expires_in: int = Query(3600, ge=60, le=86400),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    item = await service.get(db, item_id)
    await authz.ensure_can_read_document(db, current_user, item)
    download_url = await service.get_download_url(item, expires_in=expires_in)
    return DocumentDownloadResponse(download_url=download_url, expires_in=expires_in)


@router.get('/{item_id}', response_model=DocumentResponse, summary='Get Document by id')
async def get_document(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
):
    item = await service.get(db, item_id)
    await authz.ensure_can_read_document(db, current_user, item)
    return await service.to_response(item)


@router.patch('/{item_id}', response_model=DocumentResponse, summary='Update Document metadata')
async def update_document(
    item_id: UUID,
    payload: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    payload_data = payload.model_dump(exclude_unset=True)
    item = await service.get(db, item_id)
    await authz.ensure_can_read_document(db, current_user, item)
    updated = await service.update(db, item_id, payload_data)
    return await service.to_response(updated)


@router.delete('/{item_id}', status_code=204, summary='Delete Document')
async def delete_document(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_club_leadership),
):
    item = await service.get(db, item_id)
    await authz.ensure_can_read_document(db, current_user, item)
    await service.delete_with_storage(db, item_id)
    return Response(status_code=204)
