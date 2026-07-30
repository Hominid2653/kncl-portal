import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import Unauthorized, ValidationError
from app.core.rate_limit import otp_email_limiter, otp_ip_limiter
from app.models.email_verification import EmailVerification
from app.models.enums import OtpPurpose
from app.repositories.email_verification_repository import EmailVerificationRepository
from app.services.email_service import EmailService
from app.services.email_verification_token import create_email_verification_token


class OtpService:
    def __init__(self) -> None:
        self.repository = EmailVerificationRepository()
        self.email_service = EmailService()

    @staticmethod
    def normalize_email(email: str) -> str:
        return email.strip().lower()

    def _hash_code(self, code: str) -> str:
        pepper = settings.secret_key
        return hashlib.sha256(f"{code}:{pepper}".encode()).hexdigest()

    def _generate_code(self) -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    async def request_otp(
        self,
        db: AsyncSession,
        *,
        email: str,
        purpose: OtpPurpose,
        client_ip: str | None = None,
    ) -> None:
        normalized = self.normalize_email(email)
        otp_email_limiter.check(normalized)
        if client_ip:
            otp_ip_limiter.check(client_ip)

        code = self._generate_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes)
        verification = EmailVerification(
            email=normalized,
            purpose=purpose,
            code_hash=self._hash_code(code),
            attempts=0,
            expires_at=expires_at,
        )
        db.add(verification)
        await db.commit()
        await self.email_service.send_otp_email(email=normalized, code=code, purpose=purpose)

    async def verify_otp(
        self,
        db: AsyncSession,
        *,
        email: str,
        code: str,
        purpose: OtpPurpose,
    ) -> dict[str, object]:
        normalized = self.normalize_email(email)
        verification = await self.repository.get_latest_active(
            db,
            email=normalized,
            purpose=purpose,
        )
        if not verification:
            raise ValidationError("No active verification code found for this email.")

        if verification.attempts >= settings.otp_max_attempts:
            raise Unauthorized("Too many failed verification attempts. Request a new code.")

        if verification.code_hash != self._hash_code(code):
            verification.attempts += 1
            await db.commit()
            raise ValidationError("Invalid verification code.")

        verification.verified_at = datetime.now(timezone.utc)
        await db.commit()

        token, expires_in = create_email_verification_token(email=normalized, purpose=purpose)
        return {
            "email_verification_token": token,
            "expires_in": expires_in,
        }
