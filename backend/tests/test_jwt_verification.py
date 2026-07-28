import base64
from datetime import datetime, timedelta, timezone
from uuid import UUID

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from jose import jwt

from app.core.config import settings
from app.core.exceptions import Unauthorized
from app.core.security import create_supabase_token, decode_supabase_token
from app.core.supabase_jwks import clear_jwks_cache
from app.seed.data import AUTH_FED_ADMIN_ID


def _int_to_base64url(value: int) -> str:
    byte_length = (value.bit_length() + 7) // 8
    return base64.urlsafe_b64encode(value.to_bytes(byte_length, "big")).decode().rstrip("=")


@pytest.fixture
def es256_token_pair() -> dict:
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    public_numbers = public_key.public_numbers()
    kid = "test-es256-key"

    jwks = {
        "keys": [
            {
                "kty": "EC",
                "crv": "P-256",
                "alg": "ES256",
                "kid": kid,
                "x": _int_to_base64url(public_numbers.x),
                "y": _int_to_base64url(public_numbers.y),
            }
        ]
    }

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": str(AUTH_FED_ADMIN_ID),
            "email": "grace.wanjiru@kncl.local",
            "aud": "authenticated",
            "role": "authenticated",
            "iat": now,
            "exp": now + timedelta(hours=1),
        },
        private_pem,
        algorithm="ES256",
        headers={"kid": kid},
    )
    return {"token": token, "jwks": jwks}


def test_decode_supabase_token_accepts_es256_with_jwks(
    es256_token_pair: dict,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    clear_jwks_cache()
    monkeypatch.setattr(settings, "supabase_jwt_secret", "")
    monkeypatch.setattr(
        "app.core.security.get_supabase_jwks",
        lambda **_: es256_token_pair["jwks"],
    )

    payload = decode_supabase_token(es256_token_pair["token"])

    assert payload.auth_user_id == AUTH_FED_ADMIN_ID
    assert payload.email == "grace.wanjiru@kncl.local"


def test_decode_supabase_token_prefers_hs256_for_legacy_tokens(jwt_secret: str) -> None:
    token = create_supabase_token(
        auth_user_id=AUTH_FED_ADMIN_ID,
        email="grace.wanjiru@kncl.local",
        secret=jwt_secret,
    )

    payload = decode_supabase_token(token)

    assert payload.auth_user_id == AUTH_FED_ADMIN_ID


def test_decode_supabase_token_rejects_es256_when_jwks_unavailable(
    es256_token_pair: dict,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    clear_jwks_cache()
    monkeypatch.setattr(settings, "supabase_jwt_secret", "")

    def _raise_jwks_error(**_kwargs):
        raise ValueError("JWKS unavailable")

    monkeypatch.setattr("app.core.security.get_supabase_jwks", _raise_jwks_error)

    with pytest.raises(Unauthorized):
        decode_supabase_token(es256_token_pair["token"])
