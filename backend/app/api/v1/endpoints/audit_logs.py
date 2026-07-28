from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.common import parse_filters
from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.audit import (
    AuditLogCreate,
    AuditLogListResponse,
    AuditLogResponse,
)
from app.services.audit_log_service import AuditLogService

router = APIRouter(prefix='/audit-logs', tags=['Audit Logs'])
service = AuditLogService()


@router.get('/', response_model=AuditLogListResponse, summary='List Audit Logs')
async def list_audit_log(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description='Page number'),
    page_size: int = Query(20, ge=1, le=100, description='Items per page'),
    sort_by: str | None = Query(None, description='Field to sort by'),
    sort_order: str = Query('asc', pattern='^(asc|desc)$', description='Sort direction'),
    search: str | None = Query(None, description='Search term'),
    filter: list[str] | None = Query(default=None, alias='filter', description='Filter as field=value'),
):
    filters = parse_filters(filter)
    return await service.list(
        db,
        filters=filters,
        search=search,
        search_fields=['action', 'entity', 'ip_address'],
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get('/{item_id}', response_model=AuditLogResponse, summary='Get AuditLog by id')
async def get_audit_log(item_id: UUID, db: AsyncSession = Depends(get_db)):
    return await service.get(db, item_id)


@router.post('/', response_model=AuditLogResponse, summary='Create AuditLog', status_code=201)
async def create_audit_log(
    payload: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
