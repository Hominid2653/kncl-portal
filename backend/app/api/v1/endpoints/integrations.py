from fastapi import APIRouter, Depends

from app.dependencies.auth import CurrentUser, require_authenticated
from app.dependencies.rate_limit import require_external_lookup
from app.schemas.external_accounts import ExternalAccountProfile
from app.services.chesscom_service import ChessComService
from app.services.fide_service import FideService
from app.services.lichess_service import LichessService

router = APIRouter(prefix="/integrations", tags=["Integrations"])
lichess_service = LichessService()
chesscom_service = ChessComService()
fide_service = FideService()


@router.get(
    "/fide/players/{fide_id}",
    response_model=ExternalAccountProfile,
    summary="Verify FIDE ID and fetch official ratings",
)
async def lookup_fide_player(
    fide_id: str,
    current_user: CurrentUser = Depends(require_external_lookup),
) -> ExternalAccountProfile:
    return await fide_service.lookup_player(fide_id)


@router.get(
    "/lichess/users/{username}",
    response_model=ExternalAccountProfile,
    summary="Verify Lichess username and fetch profile",
)
async def lookup_lichess_user(
    username: str,
    current_user: CurrentUser = Depends(require_external_lookup),
) -> ExternalAccountProfile:
    return await lichess_service.lookup_user(username)


@router.get(
    "/chesscom/users/{username}",
    response_model=ExternalAccountProfile,
    summary="Verify Chess.com username and fetch profile",
)
async def lookup_chesscom_user(
    username: str,
    current_user: CurrentUser = Depends(require_external_lookup),
) -> ExternalAccountProfile:
    return await chesscom_service.lookup_user(username)
