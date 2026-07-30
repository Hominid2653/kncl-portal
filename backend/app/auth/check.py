"""Automated auth smoke tests for local development."""

from __future__ import annotations

import argparse
import sys
import uuid
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.core.security import create_supabase_token
from app.seed.data import AUTH_FED_ADMIN_ID, USER_FED_ADMIN_ID


@dataclass
class CheckResult:
    name: str
    passed: bool
    detail: str


def _print_results(results: list[CheckResult]) -> int:
    passed = sum(1 for result in results if result.passed)
    total = len(results)

    for result in results:
        status = "PASS" if result.passed else "FAIL"
        print(f"[{status}] {result.name} - {result.detail}")

    print(f"\n{passed}/{total} checks passed")
    return 0 if passed == total else 1


def _supabase_login(email: str, password: str) -> str:
    import asyncio

    from app.services.supabase_auth_service import SupabaseAuthService

    return asyncio.run(SupabaseAuthService().login_with_password(email, password))


def run_auth_checks(
    *,
    base_url: str = "http://127.0.0.1:8000",
    email: str | None = None,
    password: str | None = None,
    use_mock: bool = False,
) -> list[CheckResult]:
    api = base_url.rstrip("/")
    results: list[CheckResult] = []

    jwt_configured = bool(settings.supabase_jwt_secret or settings.supabase_url)
    if not jwt_configured:
        results.append(
            CheckResult(
                "jwt_verification_configured",
                False,
                "Set SUPABASE_URL (JWKS) and/or SUPABASE_JWT_SECRET (legacy HS256)",
            )
        )
        return results

    if settings.supabase_jwt_secret:
        detail = "SUPABASE_JWT_SECRET loaded (legacy HS256)"
    else:
        detail = "SUPABASE_URL loaded (JWKS / ES256 verification)"
    results.append(
        CheckResult(
            "jwt_verification_configured",
            True,
            detail,
        )
    )

    if email and password:
        try:
            token = _supabase_login(email, password)
            results.append(
                CheckResult(
                    "supabase_login",
                    True,
                    f"Signed in as {email}",
                )
            )
        except Exception as exc:
            results.append(
                CheckResult(
                    "supabase_login",
                    False,
                    f"Could not sign in with Supabase: {exc}",
                )
            )
            return results
    elif use_mock:
        token = None
        results.append(
            CheckResult(
                "mock_auth",
                True,
                "Using X-Mock-Role headers instead of JWT",
            )
        )
    else:
        if not settings.supabase_jwt_secret:
            results.append(
                CheckResult(
                    "local_jwt_created",
                    False,
                    "SUPABASE_JWT_SECRET is not set — use --email and --password for real login tokens",
                )
            )
            return results
        token = create_supabase_token(
            auth_user_id=AUTH_FED_ADMIN_ID,
            email="grace.wanjiru@kncl.local",
        )
        results.append(
            CheckResult(
                "local_jwt_created",
                True,
                f"Generated JWT for seeded auth user {AUTH_FED_ADMIN_ID}",
            )
        )

    with httpx.Client(base_url=api, timeout=30) as client:
        public = client.get("/api/v1/clubs/")
        results.append(
            CheckResult(
                "public_read",
                public.status_code == 200,
                f"GET /api/v1/clubs/ -> {public.status_code}",
            )
        )

        if use_mock:
            protected = client.post(
                "/api/v1/leagues/",
                headers={
                    "X-Mock-Role": "FEDERATION_ADMIN",
                    "X-Mock-User-ID": str(USER_FED_ADMIN_ID),
                    "X-Mock-Email": "grace.wanjiru@kncl.local",
                },
                json={
                    "name": f"Auth Check League {uuid.uuid4().hex[:8]}",
                    "description": "Created by auth smoke test",
                },
            )
        else:
            protected = client.post(
                "/api/v1/leagues/",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "name": f"Auth Check League {uuid.uuid4().hex[:8]}",
                    "description": "Created by auth smoke test",
                },
            )

        protected_ok = protected.status_code in {201, 409}
        results.append(
            CheckResult(
                "protected_write",
                protected_ok,
                f"POST /api/v1/leagues/ -> {protected.status_code}",
            )
        )

        if not use_mock:
            rejected = client.post(
                "/api/v1/leagues/",
                headers={"Authorization": "Bearer invalid-token"},
                json={
                    "name": "Should Fail",
                    "description": "Invalid token test",
                },
            )
            results.append(
                CheckResult(
                    "invalid_token_rejected",
                    rejected.status_code == 401,
                    f"Invalid bearer token -> {rejected.status_code}",
                )
            )

    return results


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run automated authentication smoke tests against the local API.",
    )
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="API base URL (default: http://127.0.0.1:8000)",
    )
    parser.add_argument(
        "--email",
        help="Supabase user email for a real login test",
    )
    parser.add_argument(
        "--password",
        help="Supabase user password for a real login test",
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Test mock headers instead of JWT bearer auth",
    )
    args = parser.parse_args()

    if (args.email and not args.password) or (args.password and not args.email):
        print("Provide both --email and --password for Supabase login tests.", file=sys.stderr)
        return 1

    try:
        results = run_auth_checks(
            base_url=args.base_url,
            email=args.email,
            password=args.password,
            use_mock=args.mock,
        )
    except httpx.ConnectError:
        print(
            f"Could not connect to {args.base_url}. Start the API first:\n"
            "  uvicorn app.main:app --reload",
            file=sys.stderr,
        )
        return 1

    return _print_results(results)


if __name__ == "__main__":
    raise SystemExit(main())
