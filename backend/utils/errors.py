"""Custom error handlers and exceptions for the SubTrack API."""

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Any, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class SubTrackException(Exception):
    """Base exception for SubTrack application."""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(SubTrackException):
    """Raised when data validation fails."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="VALIDATION_ERROR",
            details=details
        )


class NotFoundError(SubTrackException):
    """Raised when a resource is not found."""
    
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} nicht gefunden",
            status_code=404,
            error_code="NOT_FOUND",
            details={"resource": resource, "id": resource_id}
        )


class DatabaseError(SubTrackException):
    """Raised when a database operation fails."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details
        )


async def subtrack_exception_handler(request: Request, exc: SubTrackException) -> JSONResponse:
    """Handle SubTrack custom exceptions."""
    logger.error(
        f"SubTrack error: {exc.error_code} - {exc.message}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "error_code": exc.error_code,
            "details": exc.details
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    logger.warning(
        f"HTTP error: {exc.status_code} - {exc.detail}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "status_code": exc.status_code
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail),
                "details": {}
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.exception(
        f"Unexpected error: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Ein unerwarteter Fehler ist aufgetreten",
                "details": {}
            }
        }
    )


def create_success_response(data: Any, message: Optional[str] = None) -> Dict[str, Any]:
    """Create a standardized success response."""
    response = {
        "success": True,
        "data": data
    }
    if message:
        response["message"] = message
    return response
