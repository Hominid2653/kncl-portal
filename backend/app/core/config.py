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
