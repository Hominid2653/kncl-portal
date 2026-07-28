from uuid import UUID

from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import Unauthorized
from app.core.supabase_jwks import get_supabase_jwks

ASYMMETRIC_ALGORITHMS = ("ES256", "RS256")
JWT_AUDIENCE = "authenticated"


class SupabaseTokenPayload(dict):
    @property
    def auth_user_id(self) -> UUID:
        return UUID(str(self["sub"]))

    @property
    def email(self) -> str:
        return str(self.get("email") or "")


def _decode_with_key(token: str, key: str | dict, algorithms: list[str]) -> dict:
    return jwt.decode(
        token,
        key,
        algorithms=algorithms,
        audience=JWT_AUDIENCE,
    )


def decode_supabase_token(token: str) -> SupabaseTokenPayload:
    if not settings.supabase_jwt_secret and not settings.supabase_url:
        raise Unauthorized("Supabase JWT verification is not configured.")

    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise Unauthorized("Invalid or expired access token.") from exc

    algorithm = header.get("alg")
    errors: list[JWTError] = []

    if algorithm == "HS256" and settings.supabase_jwt_secret:
        try:
            payload = _decode_with_key(
                token,
                settings.supabase_jwt_secret,
                ["HS256"],
            )
            return _validate_payload(payload)
        except JWTError as exc:
            errors.append(exc)

    if algorithm in ASYMMETRIC_ALGORITHMS or settings.supabase_url:
        try:
            jwks = get_supabase_jwks()
            payload = _decode_with_key(
                token,
                jwks,
                list(ASYMMETRIC_ALGORITHMS),
            )
            return _validate_payload(payload)
        except (JWTError, ValueError) as exc:
            if isinstance(exc, JWTError):
                errors.append(exc)
            else:
                raise Unauthorized("Unable to verify access token.") from exc

    if settings.supabase_jwt_secret and algorithm != "HS256":
        try:
            payload = _decode_with_key(
                token,
                settings.supabase_jwt_secret,
                ["HS256"],
            )
            return _validate_payload(payload)
        except JWTError as exc:
            errors.append(exc)

    if errors:
        raise Unauthorized("Invalid or expired access token.") from errors[-1]
    raise Unauthorized("Invalid or expired access token.")


def _validate_payload(payload: dict) -> SupabaseTokenPayload:
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
    """Create a Supabase-compatible HS256 access token (for tests and local tooling)."""
    from datetime import datetime, timedelta, timezone

    secret = secret or settings.supabase_jwt_secret
    if not secret:
        raise ValueError("Supabase JWT secret is required to create tokens.")

    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(auth_user_id),
        "email": email,
        "aud": JWT_AUDIENCE,
        "role": "authenticated",
        "iat": now,
        "exp": now + timedelta(seconds=expires_in_seconds),
    }
    return jwt.encode(payload, secret, algorithm="HS256")
