from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import CurrentUser, require_federation_admin
from app.dependencies.dependencies import get_db
from app.schemas.application import CoordinatorCreate, CoordinatorResponse
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/users", tags=["Users"])
service = ApplicationService()


@router.post(
    "/coordinators",
    response_model=CoordinatorResponse,
    status_code=201,
    summary="Create league coordinator account",
)
async def create_coordinator(
    payload: CoordinatorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_federation_admin),
):
    profile = await service.create_coordinator(db, current_user, payload)
    return CoordinatorResponse(
        id=profile.id,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        auth_user_id=profile.auth_user_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        phone=profile.phone,
        role=profile.role.value,
        coordinator_league_ids=profile.coordinator_league_ids,
    )
