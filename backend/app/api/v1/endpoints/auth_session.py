from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Unauthorized
from app.dependencies.auth import CurrentUser, require_authenticated
from app.dependencies.dependencies import get_db
from app.schemas.auth_session import (
    AuthSessionResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
)
from app.services.auth_session_service import AuthSessionService
from app.services.supabase_auth_service import SupabaseAuthService

router = APIRouter(prefix="/auth", tags=["Auth"])
session_service = AuthSessionService()
supabase_auth = SupabaseAuthService()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)


@router.get("/me", response_model=AuthSessionResponse, summary="Current session profile")
async def get_current_session(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_authenticated),
) -> AuthSessionResponse:
    return await session_service.get_session(db, current_user)


@router.post(
    "/password-reset/request",
    status_code=204,
    summary="Request a password reset email",
)
async def request_password_reset(payload: PasswordResetRequest) -> Response:
    await supabase_auth.request_password_reset(email=str(payload.email))
    return Response(status_code=204)


@router.post(
    "/password-reset/confirm",
    status_code=204,
    summary="Set a new password using a recovery access token",
)
async def confirm_password_reset(
    payload: PasswordResetConfirm,
    token: str | None = Depends(oauth2_scheme),
) -> Response:
    if not token:
        raise Unauthorized("Recovery token is required.")
    await supabase_auth.update_password_with_token(token, payload.password)
    return Response(status_code=204)
