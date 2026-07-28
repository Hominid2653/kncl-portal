from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.transfer_approval import (
    TransferApprovalCreate,
    TransferApprovalListResponse,
    TransferApprovalResponse,
)
from app.services.transfer_approval_service import TransferApprovalService

router = APIRouter(prefix='/transfer-approvals', tags=['Transfer Approvals'])
service = TransferApprovalService()


@router.get('/', response_model=TransferApprovalListResponse, summary='List transfer approvals')
async def list_transfer_approvals(db: AsyncSession = Depends(get_db)):
    approvals = await service.list(db)
    return {'items': approvals, 'total': len(approvals)}


@router.post('/', response_model=TransferApprovalResponse, summary='Create transfer approval', status_code=201)
async def create_transfer_approval(
    payload: TransferApprovalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
