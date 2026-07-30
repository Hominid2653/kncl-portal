from app.core.config import settings
from app.core.exceptions import ExternalServiceError
from app.core.logging import logger
from app.models.enums import OtpPurpose

import httpx


class EmailService:
    async def send_otp_email(self, *, email: str, code: str, purpose: OtpPurpose) -> None:
        subject = (
            "Your KNCL application verification code"
            if purpose is OtpPurpose.APPLICATION_SUBMIT
            else "Your KNCL application status code"
        )
        text = (
            f"Your KNCL verification code is {code}.\n\n"
            f"It expires in {settings.otp_expiry_minutes} minutes."
        )
        await self._send_email(to=email, subject=subject, text=text)

    async def send_application_received(self, *, email: str, application_type: str) -> None:
        await self._send_email(
            to=email,
            subject="KNCL application received",
            text=f"Your {application_type} application has been received and is pending review.",
        )

    async def send_welcome_email(self, *, email: str, role: str, sign_in_url: str) -> None:
        await self._send_email(
            to=email,
            subject="Welcome to KNCL Portal",
            text=f"Your {role} account is ready. Sign in at {sign_in_url}",
        )

    async def send_rejection_email(
        self,
        *,
        email: str,
        application_type: str,
        rejection_reason: str,
    ) -> None:
        await self._send_email(
            to=email,
            subject="KNCL application update",
            text=(
                f"Your {application_type} application was not approved.\n\n"
                f"Reason: {rejection_reason}"
            ),
        )

    async def _send_email(self, *, to: str, subject: str, text: str) -> None:
        if not settings.resend_api_key:
            logger.info("email.dev_fallback to=%s subject=%s body=%s", to, subject, text)
            return

        payload = {
            "from": settings.resend_from_email,
            "to": [to],
            "subject": subject,
            "text": text,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.resend_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code >= 400:
            logger.error(
                "resend.failed status=%s body=%s",
                response.status_code,
                response.text,
            )
            raise ExternalServiceError("Unable to send email at this time.")
