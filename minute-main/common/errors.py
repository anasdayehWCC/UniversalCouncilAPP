"""Standardized error handling for the API.

This module provides a consistent error response format across all API endpoints.
Use APIException instead of HTTPException for machine-readable error codes.

Example:
    from common.errors import APIException
    
    raise APIException(
        status_code=404,
        message="Transcription not found",
        error_code="TRANSCRIPTION_NOT_FOUND"
    )

Error Response Format:
    {
        "detail": {
            "status_code": 404,
            "message": "Transcription not found",
            "error_code": "TRANSCRIPTION_NOT_FOUND",
            "timestamp": "2026-03-28T10:30:00Z"
        }
    }
"""

from datetime import UTC, datetime
from typing import Any, Optional

from fastapi import HTTPException
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    """Structured error detail for API responses."""

    status_code: int = Field(..., description="HTTP status code")
    message: str = Field(..., description="Human-readable error message")
    error_code: Optional[str] = Field(None, description="Machine-readable error code")
    timestamp: Optional[str] = Field(None, description="ISO 8601 timestamp")
    path: Optional[str] = Field(None, description="Request path where error occurred")
    context: Optional[dict[str, Any]] = Field(
        None, description="Additional context (stripped in production)"
    )


# Common error codes for consistency
class ErrorCodes:
    """Standard error codes for API responses."""

    # Authentication/Authorization
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    TOKEN_INVALID = "TOKEN_INVALID"

    # Resource errors
    NOT_FOUND = "NOT_FOUND"
    TRANSCRIPTION_NOT_FOUND = "TRANSCRIPTION_NOT_FOUND"
    MINUTE_NOT_FOUND = "MINUTE_NOT_FOUND"
    MINUTE_VERSION_NOT_FOUND = "MINUTE_VERSION_NOT_FOUND"
    RECORDING_NOT_FOUND = "RECORDING_NOT_FOUND"
    TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND"
    USER_NOT_FOUND = "USER_NOT_FOUND"
    TASK_NOT_FOUND = "TASK_NOT_FOUND"
    CONFIG_NOT_FOUND = "CONFIG_NOT_FOUND"

    # Validation errors
    BAD_REQUEST = "BAD_REQUEST"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_INPUT = "INVALID_INPUT"

    # State errors
    CONFLICT = "CONFLICT"
    STILL_PROCESSING = "STILL_PROCESSING"
    ALREADY_EXISTS = "ALREADY_EXISTS"

    # Service errors
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"

    # Module/feature errors
    MODULE_DISABLED = "MODULE_DISABLED"
    FEATURE_DISABLED = "FEATURE_DISABLED"


def _default_error_code(status_code: int) -> str:
    """Map HTTP status codes to default error codes."""
    codes = {
        400: ErrorCodes.BAD_REQUEST,
        401: ErrorCodes.UNAUTHORIZED,
        403: ErrorCodes.FORBIDDEN,
        404: ErrorCodes.NOT_FOUND,
        409: ErrorCodes.CONFLICT,
        422: ErrorCodes.VALIDATION_ERROR,
        500: ErrorCodes.INTERNAL_ERROR,
        503: ErrorCodes.SERVICE_UNAVAILABLE,
    }
    return codes.get(status_code, ErrorCodes.INTERNAL_ERROR)


class APIException(HTTPException):
    """Standardized API exception with structured error details.
    
    Use this instead of HTTPException for consistent error responses
    with machine-readable error codes.
    
    Args:
        status_code: HTTP status code
        message: Human-readable error message
        error_code: Machine-readable code (defaults based on status_code)
        context: Additional debug context (stripped in production)
        headers: Custom HTTP response headers
    
    Example:
        raise APIException(
            status_code=404,
            message="Transcription not found",
            error_code=ErrorCodes.TRANSCRIPTION_NOT_FOUND
        )
    """

    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: Optional[str] = None,
        context: Optional[dict[str, Any]] = None,
        headers: Optional[dict[str, str]] = None,
    ):
        error_detail = ErrorDetail(
            status_code=status_code,
            message=message,
            error_code=error_code or _default_error_code(status_code),
            timestamp=datetime.now(UTC).isoformat(),
            context=context,
        )
        
        super().__init__(
            status_code=status_code,
            detail=error_detail.model_dump(exclude_none=True),
            headers=headers,
        )


# Convenience factory functions for common errors
def not_found(resource: str = "Resource", error_code: Optional[str] = None) -> APIException:
    """Create a 404 Not Found exception."""
    return APIException(
        status_code=404,
        message=f"{resource} not found",
        error_code=error_code or ErrorCodes.NOT_FOUND,
    )


def unauthorized(message: str = "Not authenticated") -> APIException:
    """Create a 401 Unauthorized exception."""
    return APIException(
        status_code=401,
        message=message,
        error_code=ErrorCodes.UNAUTHORIZED,
        headers={"WWW-Authenticate": "Bearer"},
    )


def forbidden(message: str = "Access denied") -> APIException:
    """Create a 403 Forbidden exception."""
    return APIException(
        status_code=403,
        message=message,
        error_code=ErrorCodes.FORBIDDEN,
    )


def bad_request(message: str, error_code: Optional[str] = None) -> APIException:
    """Create a 400 Bad Request exception."""
    return APIException(
        status_code=400,
        message=message,
        error_code=error_code or ErrorCodes.BAD_REQUEST,
    )


def conflict(message: str, error_code: Optional[str] = None) -> APIException:
    """Create a 409 Conflict exception."""
    return APIException(
        status_code=409,
        message=message,
        error_code=error_code or ErrorCodes.CONFLICT,
    )


def service_unavailable(message: str = "Service temporarily unavailable") -> APIException:
    """Create a 503 Service Unavailable exception."""
    return APIException(
        status_code=503,
        message=message,
        error_code=ErrorCodes.SERVICE_UNAVAILABLE,
    )
