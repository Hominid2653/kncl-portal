from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas.auth_login import TokenResponse
from app.services.supabase_auth_service import SupabaseAuthService

router = APIRouter(prefix="/auth", tags=["Auth"])
service = SupabaseAuthService()


@router.post(
    "/token",
    response_model=TokenResponse,
    summary="Login with email and password",
    description=(
        "Exchange Supabase credentials for a Bearer access token. "
        "In Swagger, use your **email** as the username."
    ),
)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> TokenResponse:
    access_token = await service.login_with_password(
        email=form_data.username,
        password=form_data.password,
    )
    return TokenResponse(access_token=access_token)
