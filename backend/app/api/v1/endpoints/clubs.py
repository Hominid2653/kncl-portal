from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.club import ClubCreate, ClubListResponse, ClubResponse
from app.services.club_service import ClubService

router = APIRouter(prefix='/clubs', tags=['Clubs'])
service = ClubService()


@router.get('/', response_model=ClubListResponse, summary='List clubs')
async def list_clubs(db: AsyncSession = Depends(get_db)):
    clubs = await service.list(db)
    return {'items': clubs, 'total': len(clubs)}


@router.post('/', response_model=ClubResponse, summary='Create club', status_code=201)
async def create_club(
    payload: ClubCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
