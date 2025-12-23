"""Constants for the SubTrack backend application."""

from enum import Enum

# Billing cycle options
class BillingCycle(str, Enum):
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"

# Valid billing cycles list for validation
VALID_BILLING_CYCLES = [cycle.value for cycle in BillingCycle]

# Input length limits
MAX_NAME_LENGTH = 200
MAX_CATEGORY_LENGTH = 100
MAX_NOTES_LENGTH = 1000
MAX_URL_LENGTH = 500

# Database limits
MAX_QUERY_LIMIT = 1000
DEFAULT_SORT_ORDER = 1  # Ascending
