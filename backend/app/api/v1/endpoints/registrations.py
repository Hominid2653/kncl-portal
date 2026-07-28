from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.registration import (
    RegistrationCreate,
    RegistrationListResponse,
    RegistrationResponse,
)
from app.services.registration_service import RegistrationService

router = APIRouter(prefix='/registrations', tags=['Registrations'])
service = RegistrationService()


@router.get('/', response_model=RegistrationListResponse, summary='List registrations')
async def list_registrations(db: AsyncSession = Depends(get_db)):
    registrations = await service.list(db)
    return {'items': registrations, 'total': len(registrations)}


@router.post('/', response_model=RegistrationResponse, summary='Create registration', status_code=201)
async def create_registration(
    payload: RegistrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
