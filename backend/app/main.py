from fastapi import FastAPI
from app.api.router import api_router
from app.core.config import settings
from sqlalchemy import text

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)

app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "KNCL Transfer Portal API",
        "status": "running",
    }

@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "status": "ok",
        }

    except Exception as e:
        return {
            "database": "disconnected",
            "error": str(e),
        }