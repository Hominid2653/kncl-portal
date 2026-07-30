from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import Unauthorized
from app.models.enums import OtpPurpose
from app.services.email_verification_token import (
    EmailVerificationTokenPayload,
    decode_email_verification_token,
)

email_verification_bearer = HTTPBearer(auto_error=False)


async def require_email_verification_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(email_verification_bearer),
) -> EmailVerificationTokenPayload:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise Unauthorized("Email verification token is required.")

    return decode_email_verification_token(credentials.credentials)


async def require_application_submit_token(
    token: EmailVerificationTokenPayload = Depends(require_email_verification_token),
) -> EmailVerificationTokenPayload:
    if token.purpose is not OtpPurpose.APPLICATION_SUBMIT:
        raise Unauthorized("This token is not valid for application submission.")
    return token


async def require_status_lookup_token(
    token: EmailVerificationTokenPayload = Depends(require_email_verification_token),
) -> EmailVerificationTokenPayload:
    if token.purpose is not OtpPurpose.STATUS_LOOKUP:
        raise Unauthorized("This token is not valid for application status lookup.")
    return token
