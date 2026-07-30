from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "KNCL Transfer Portal"
    app_env: str = "development"
    auth_mock_enabled: bool = True
    auth_mock_default_role: str = "PLAYER"

    database_url: str

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = ""
    supabase_storage_bucket: str = "documents"
    max_upload_size_bytes: int = 10 * 1024 * 1024

    lichess_base_url: str = "https://lichess.org"
    chesscom_base_url: str = "https://api.chess.com"
    external_api_cache_ttl_seconds: int = 600
    external_api_rate_limit_requests: int = 30
    external_api_rate_limit_window_seconds: int = 60

    secret_key: str

    resend_api_key: str = ""
    resend_from_email: str = "KNCL Portal <noreply@kncl.local>"
    otp_expiry_minutes: int = 10
    otp_max_attempts: int = 5
    email_verification_jwt_secret: str = ""
    email_verification_jwt_expiry_seconds: int = 900
    otp_rate_limit_per_email: int = 3
    otp_rate_limit_email_window_seconds: int = 900
    otp_rate_limit_per_ip: int = 10
    otp_rate_limit_ip_window_seconds: int = 3600

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
