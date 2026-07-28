from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.transfer import TransferCreate, TransferListResponse, TransferResponse
from app.services.transfer_service import TransferService

router = APIRouter(prefix='/transfers', tags=['Transfers'])
service = TransferService()


@router.get('/', response_model=TransferListResponse, summary='List transfers')
async def list_transfers(db: AsyncSession = Depends(get_db)):
    transfers = await service.list(db)
    return {'items': transfers, 'total': len(transfers)}


@router.post('/', response_model=TransferResponse, summary='Create transfer', status_code=201)
async def create_transfer(
    payload: TransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
