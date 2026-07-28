from fastapi import APIRouter, Depends

from app.dependencies.auth import CurrentUser, require_authenticated
from app.schemas.lichess import LichessUserResponse
from app.services.lichess_service import LichessService

router = APIRouter(prefix="/integrations/lichess", tags=["Lichess"])
service = LichessService()


@router.get(
    "/users/{username}",
    response_model=LichessUserResponse,
    summary="Verify Lichess username and fetch profile",
)
async def lookup_lichess_user(
    username: str,
    current_user: CurrentUser = Depends(require_authenticated),
) -> LichessUserResponse:
    return await service.lookup_user(username)
