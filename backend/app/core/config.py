from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_sync_database_url(url: str) -> str:
    if url.startswith("postgresql+psycopg://"):
        return url
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def normalize_async_database_url(url: str) -> str:
    return normalize_sync_database_url(url)


class Settings(BaseSettings):
    app_name: str = "KNCL Transfer Portal"
    app_env: str = "development"
    auth_mock_enabled: bool = True
    auth_mock_default_role: str = "PLAYER"

    database_url: str

    supabase_url: str
    supabase_anon_key: str = Field(
        validation_alias=AliasChoices("SUPABASE_ANON_KEY", "SUPABASE_KEY"),
    )
    supabase_service_role_key: str
    supabase_jwt_secret: str = ""
    supabase_storage_bucket: str = "documents"
    max_upload_size_bytes: int = 10 * 1024 * 1024

    lichess_base_url: str = "https://lichess.org"
    chesscom_base_url: str = "https://api.chess.com"
    external_api_cache_ttl_seconds: int = 600
    external_api_rate_limit_requests: int = 30
    external_api_rate_limit_window_seconds: int = 60

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    secret_key: str

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
