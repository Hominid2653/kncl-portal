from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings
from app.core.handlers import register_exception_handlers
from app.core.logging import logger, setup_logging

setup_logging()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)

# Browser preflight is required when the frontend sends Authorization or X-Mock-* headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)


@app.middleware("http")
async def add_request_id(request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request completed method=%s path=%s status=%s request_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        request_id,
    )
    return response


app.include_router(
    api_router,
    prefix="/api/v1",
)

@app.get("/")
def root():
    return {
        "message": "KNCL Transfer Portal API",
        "status": "running",
    }

