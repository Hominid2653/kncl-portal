from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR

from app.core.exceptions import KNCLException
from app.core.logging import logger


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def _error_response(
    request: Request,
    *,
    status_code: int,
    error_code: str,
    detail: object,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": detail,
            "error": {
                "code": error_code,
                "request_id": _request_id(request),
            },
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(KNCLException)
    async def kncl_exception_handler(request: Request, exc: KNCLException) -> JSONResponse:
        logger.warning(
            "handled application error code=%s status=%s path=%s request_id=%s",
            exc.error_code,
            exc.status_code,
            request.url.path,
            _request_id(request),
        )
        return _error_response(
            request,
            status_code=exc.status_code,
            error_code=exc.error_code,
            detail=exc.message,
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        logger.warning(
            "HTTP error status=%s path=%s request_id=%s",
            exc.status_code,
            request.url.path,
            _request_id(request),
        )
        return _error_response(
            request,
            status_code=exc.status_code,
            error_code="http_error",
            detail=exc.detail,
        )

    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        return await http_exception_handler(request, exc)

    @app.exception_handler(RequestValidationError)
    async def request_validation_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        errors = [
            {"location": error["loc"], "message": error["msg"], "type": error["type"]}
            for error in exc.errors()
        ]
        logger.warning(
            "request validation failed path=%s request_id=%s errors=%s",
            request.url.path,
            _request_id(request),
            errors,
        )
        return _error_response(
            request,
            status_code=422,
            error_code="request_validation_error",
            detail=errors,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "unhandled error path=%s request_id=%s",
            request.url.path,
            _request_id(request),
        )
        return _error_response(
            request,
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="internal_error",
            detail="An unexpected error occurred.",
        )
