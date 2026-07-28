from fastapi import APIRouter
from sqlalchemy import text

from app.core.exceptions import DatabaseUnavailable
from app.database.database import engine

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    return {"status": "healthy"}


@router.get("/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "status": "ok",
        }

    except Exception as exc:
        raise DatabaseUnavailable("Database connection is unavailable.") from exc
