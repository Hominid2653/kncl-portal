from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.club_member import (
    ClubMemberCreate,
    ClubMemberListResponse,
    ClubMemberResponse,
)
from app.services.club_member_service import ClubMemberService

router = APIRouter(prefix='/club-members', tags=['Club Members'])
service = ClubMemberService()


@router.get('/', response_model=ClubMemberListResponse, summary='List club members')
async def list_club_members(db: AsyncSession = Depends(get_db)):
    members = await service.list(db)
    return {'items': members, 'total': len(members)}


@router.post('/', response_model=ClubMemberResponse, summary='Create club member', status_code=201)
async def create_club_member(
    payload: ClubMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
