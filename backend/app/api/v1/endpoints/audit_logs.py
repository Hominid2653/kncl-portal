from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.audit import AuditLogCreate, AuditLogListResponse, AuditLogResponse
from app.services.audit_log_service import AuditLogService

router = APIRouter(prefix='/audit-logs', tags=['Audit Logs'])
service = AuditLogService()


@router.get('/', response_model=AuditLogListResponse, summary='List audit logs')
async def list_audit_logs(db: AsyncSession = Depends(get_db)):
    audit_logs = await service.list(db)
    return {'items': audit_logs, 'total': len(audit_logs)}


@router.post('/', response_model=AuditLogResponse, summary='Create audit log', status_code=201)
async def create_audit_log(
    payload: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
