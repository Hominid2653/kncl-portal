from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.user_profile import (
    UserProfileCreate,
    UserProfileListResponse,
    UserProfileResponse,
)
from app.services.user_profile_service import UserProfileService

router = APIRouter(prefix='/user-profiles', tags=['User Profiles'])
service = UserProfileService()


@router.get('/', response_model=UserProfileListResponse, summary='List user profiles')
async def list_user_profiles(db: AsyncSession = Depends(get_db)):
    profiles = await service.list(db)
    return {'items': profiles, 'total': len(profiles)}


@router.post('/', response_model=UserProfileResponse, summary='Create user profile', status_code=201)
async def create_user_profile(
    payload: UserProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    return await service.create(db, payload)
