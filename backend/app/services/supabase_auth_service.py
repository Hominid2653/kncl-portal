import httpx

from app.core.config import settings
from app.core.exceptions import Unauthorized, ValidationError


class SupabaseAuthService:
    async def login_with_password(self, email: str, password: str) -> str:
        if not settings.supabase_url or not settings.supabase_anon_key:
            raise Unauthorized("Supabase authentication is not configured.")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/token",
                params={"grant_type": "password"},
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Content-Type": "application/json",
                },
                json={"email": email.strip(), "password": password},
            )

        if response.status_code >= 400:
            detail = response.json().get("error_description") or response.json().get(
                "msg",
                "Invalid email or password.",
            )
            raise Unauthorized(str(detail))

        token = response.json().get("access_token")
        if not token:
            raise Unauthorized("Supabase login succeeded but no access token was returned.")
        return token

    async def request_password_reset(self, email: str) -> None:
        if not settings.supabase_url or not settings.supabase_anon_key:
            raise Unauthorized("Supabase authentication is not configured.")

        redirect_to = f"{settings.frontend_url.rstrip('/')}/reset-password"
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/recover",
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Content-Type": "application/json",
                },
                json={"email": email.strip().lower(), "redirect_to": redirect_to},
            )

        if response.status_code >= 400:
            detail = response.json().get("error_description") or response.json().get(
                "msg",
                "Unable to send password reset email.",
            )
            raise ValidationError(str(detail))

    async def update_password_with_token(self, access_token: str, password: str) -> None:
        if not settings.supabase_url or not settings.supabase_anon_key:
            raise Unauthorized("Supabase authentication is not configured.")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.put(
                f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json={"password": password},
            )

        if response.status_code >= 400:
            detail = response.json().get("error_description") or response.json().get(
                "msg",
                "Unable to update password.",
            )
            raise ValidationError(str(detail))

    async def change_password(self, email: str, current_password: str, new_password: str) -> None:
        token = await self.login_with_password(email, current_password)
        await self.update_password_with_token(token, new_password)
