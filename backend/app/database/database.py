from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import (
    normalize_async_database_url,
    normalize_sync_database_url,
    settings,
)

engine = create_engine(
    normalize_sync_database_url(settings.database_url),
    echo=settings.app_env.lower() in {"development", "test", "testing"},
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

async_engine = create_async_engine(
    normalize_async_database_url(settings.database_url),
    echo=settings.app_env.lower() in {"development", "test", "testing"},
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autoflush=False,
    expire_on_commit=False,
)
