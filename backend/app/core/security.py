from uuid import UUID

from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import Unauthorized


class SupabaseTokenPayload(dict):
    @property
    def auth_user_id(self) -> UUID:
        return UUID(str(self["sub"]))

    @property
    def email(self) -> str:
        return str(self.get("email") or "")


def decode_supabase_token(token: str) -> SupabaseTokenPayload:
    if not settings.supabase_jwt_secret:
        raise Unauthorized("Supabase JWT verification is not configured.")

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as exc:
        raise Unauthorized("Invalid or expired access token.") from exc

    if "sub" not in payload:
        raise Unauthorized("Token is missing a subject claim.")

    return SupabaseTokenPayload(payload)


def create_supabase_token(
    *,
    auth_user_id: UUID,
    email: str,
    secret: str | None = None,
    expires_in_seconds: int = 3600,
) -> str:
    """Create a Supabase-compatible access token (for tests and local tooling)."""
    from datetime import datetime, timedelta, timezone

    secret = secret or settings.supabase_jwt_secret
    if not secret:
        raise ValueError("Supabase JWT secret is required to create tokens.")

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(auth_user_id),
        "email": email,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": now,
        "exp": now + timedelta(seconds=expires_in_seconds),
    }
    return jwt.encode(payload, secret, algorithm="HS256")
