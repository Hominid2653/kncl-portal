from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import Unauthorized
from app.models.enums import OtpPurpose

EMAIL_VERIFICATION_TOKEN_TYPE = "email_verification"


class EmailVerificationTokenPayload(dict):
    @property
    def email(self) -> str:
        return str(self["sub"])

    @property
    def purpose(self) -> OtpPurpose:
        return OtpPurpose(str(self["purpose"]))


def _jwt_secret() -> str:
    return settings.email_verification_jwt_secret or settings.secret_key


def create_email_verification_token(*, email: str, purpose: OtpPurpose) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    expires_in = settings.email_verification_jwt_expiry_seconds
    payload = {
        "sub": email,
        "purpose": purpose.value,
        "type": EMAIL_VERIFICATION_TOKEN_TYPE,
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    token = jwt.encode(payload, _jwt_secret(), algorithm="HS256")
    return token, expires_in


def decode_email_verification_token(token: str) -> EmailVerificationTokenPayload:
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
    except JWTError as exc:
        raise Unauthorized("Invalid or expired email verification token.") from exc

    if payload.get("type") != EMAIL_VERIFICATION_TOKEN_TYPE:
        raise Unauthorized("Invalid email verification token type.")
    if "sub" not in payload or "purpose" not in payload:
        raise Unauthorized("Email verification token is missing required claims.")

    return EmailVerificationTokenPayload(payload)
