from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_verification import EmailVerification
from app.models.enums import OtpPurpose
from app.repositories.base_repository import BaseRepository


class EmailVerificationRepository(BaseRepository[EmailVerification]):
    def __init__(self) -> None:
        super().__init__(EmailVerification)

    async def get_latest_active(
        self,
        db: AsyncSession,
        *,
        email: str,
        purpose: OtpPurpose,
    ) -> EmailVerification | None:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(EmailVerification)
            .where(
                EmailVerification.email == email,
                EmailVerification.purpose == purpose,
                EmailVerification.verified_at.is_(None),
                EmailVerification.expires_at > now,
            )
            .order_by(EmailVerification.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
