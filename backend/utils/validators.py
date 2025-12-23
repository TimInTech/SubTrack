"""Validation utilities for the SubTrack API."""

from typing import Optional, Any
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from .errors import ValidationError, NotFoundError
from .constants import VALID_BILLING_CYCLES


def validate_objectid(id_str: str, resource_name: str = "Resource") -> ObjectId:
    """
    Validate and convert string to MongoDB ObjectId.
    
    Args:
        id_str: String representation of ObjectId
        resource_name: Name of the resource for error messages
        
    Returns:
        Valid ObjectId
        
    Raises:
        ValidationError: If id_str is not a valid ObjectId
    """
    try:
        return ObjectId(id_str)
    except (InvalidId, TypeError) as e:
        raise ValidationError(
            message=f"Ungültige {resource_name} ID",
            details={"id": id_str, "error": str(e)}
        )


def validate_positive_amount(amount: Optional[int], field_name: str = "amount_cents") -> None:
    """
    Validate that an amount is positive.
    
    Args:
        amount: Amount in cents to validate
        field_name: Name of the field for error messages
        
    Raises:
        ValidationError: If amount is not positive
    """
    if amount is not None and amount <= 0:
        raise ValidationError(
            message=f"{field_name} muss größer als 0 sein",
            details={field_name: amount}
        )


def validate_url(url: Optional[str], field_name: str = "url") -> None:
    """
    Validate URL format.
    
    Args:
        url: URL string to validate
        field_name: Name of the field for error messages
        
    Raises:
        ValidationError: If URL format is invalid
    """
    if url is not None and url.strip():
        if not (url.startswith('http://') or url.startswith('https://')):
            raise ValidationError(
                message=f"{field_name} muss mit http:// oder https:// beginnen",
                details={field_name: url}
            )


def validate_date_format(date_str: Optional[str], field_name: str = "date") -> None:
    """
    Validate ISO date format (YYYY-MM-DD).
    
    Args:
        date_str: Date string to validate
        field_name: Name of the field for error messages
        
    Raises:
        ValidationError: If date format is invalid
    """
    if date_str is not None:
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError as e:
            raise ValidationError(
                message=f"Ungültiges Datumsformat für {field_name}. Erwartet: YYYY-MM-DD",
                details={field_name: date_str, "error": str(e)}
            )


def validate_billing_cycle(cycle: Optional[str]) -> None:
    """
    Validate billing cycle value.
    
    Args:
        cycle: Billing cycle to validate
        
    Raises:
        ValidationError: If billing cycle is invalid
    """
    if cycle is not None and cycle not in VALID_BILLING_CYCLES:
        raise ValidationError(
            message="Ungültiger Abrechnungszyklus",
            details={"billing_cycle": cycle, "valid_values": VALID_BILLING_CYCLES}
        )


def sanitize_string(value: Optional[str], max_length: int = 500) -> Optional[str]:
    """
    Sanitize and truncate string input.
    
    Args:
        value: String to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string or None
    """
    if value is None:
        return None
    
    # Strip whitespace
    sanitized = value.strip()
    
    # Truncate if too long
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized if sanitized else None
