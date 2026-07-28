class KNCLException(Exception):
    """Base application exception."""

    status_code = 500
    error_code = "internal_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class ResourceNotFound(KNCLException):
    status_code = 404
    error_code = "resource_not_found"


class DuplicateResource(KNCLException):
    status_code = 409
    error_code = "duplicate_resource"


class ValidationError(KNCLException):
    status_code = 400
    error_code = "validation_error"


class Unauthorized(KNCLException):
    status_code = 401
    error_code = "unauthorized"


class Forbidden(KNCLException):
    status_code = 403
    error_code = "forbidden"


class DatabaseUnavailable(KNCLException):
    status_code = 503
    error_code = "database_unavailable"


class ExternalServiceError(KNCLException):
    status_code = 502
    error_code = "external_service_error"


class RateLimitExceeded(KNCLException):
    status_code = 429
    error_code = "rate_limit_exceeded"
