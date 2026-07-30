from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.dependencies import get_db
from app.dependencies.email_verification import require_status_lookup_token
from app.schemas.auth_otp import ApplicationStatusResponse
from app.services.application_status_service import ApplicationStatusService
from app.services.email_verification_token import EmailVerificationTokenPayload

router = APIRouter(tags=["Application Status"])
service = ApplicationStatusService()


@router.get(
    "/application-status",
    response_model=ApplicationStatusResponse,
    summary="Lookup application status for verified email",
)
async def get_application_status(
    db: AsyncSession = Depends(get_db),
    token: EmailVerificationTokenPayload = Depends(require_status_lookup_token),
) -> ApplicationStatusResponse:
    return await service.get_status_for_email(db, token.email)
