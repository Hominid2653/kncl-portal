from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.player import PlayerCreate, PlayerListResponse, PlayerResponse
from app.services.player_service import PlayerService

router = APIRouter(prefix='/players', tags=['Players'])
service = PlayerService()


@router.get('/', response_model=PlayerListResponse, summary='List players')
async def list_players(db: AsyncSession = Depends(get_db)):
    players = await service.list(db)
    return {'items': players, 'total': len(players)}


@router.post('/', response_model=PlayerResponse, summary='Create player', status_code=201)
async def create_player(
    payload: PlayerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
