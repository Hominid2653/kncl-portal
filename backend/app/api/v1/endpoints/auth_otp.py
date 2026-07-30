from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.dependencies import get_db
from app.schemas.auth_otp import OtpRequest, OtpVerifyRequest, OtpVerifyResponse
from app.services.otp_service import OtpService

router = APIRouter(prefix="/auth/otp", tags=["Auth OTP"])
service = OtpService()


@router.post("/request", status_code=204, summary="Request OTP email")
async def request_otp(
    payload: OtpRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> None:
    client_ip = request.client.host if request.client else None
    await service.request_otp(
        db,
        email=str(payload.email),
        purpose=payload.purpose,
        client_ip=client_ip,
    )


@router.post("/verify", response_model=OtpVerifyResponse, summary="Verify OTP code")
async def verify_otp(
    payload: OtpVerifyRequest,
    db: AsyncSession = Depends(get_db),
) -> OtpVerifyResponse:
    result = await service.verify_otp(
        db,
        email=str(payload.email),
        code=payload.code,
        purpose=payload.purpose,
    )
    return OtpVerifyResponse(**result)
