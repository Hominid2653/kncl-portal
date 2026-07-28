from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.season import SeasonCreate, SeasonListResponse, SeasonResponse
from app.services.season_service import SeasonService

router = APIRouter(prefix='/seasons', tags=['Seasons'])
service = SeasonService()


@router.get('/', response_model=SeasonListResponse, summary='List seasons')
async def list_seasons(db: AsyncSession = Depends(get_db)):
    seasons = await service.list(db)
    return {'items': seasons, 'total': len(seasons)}


@router.post('/', response_model=SeasonResponse, summary='Create season', status_code=201)
async def create_season(
    payload: SeasonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
