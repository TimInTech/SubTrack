from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import csv
import io
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from enum import Enum

# Import custom utilities
from utils.errors import (
    SubTrackException,
    ValidationError,
    NotFoundError,
    DatabaseError,
    subtrack_exception_handler,
    http_exception_handler,
    general_exception_handler,
    create_success_response
)
from utils.validators import (
    validate_objectid,
    validate_positive_amount,
    validate_url,
    validate_date_format,
    validate_billing_cycle,
    sanitize_string
)
from utils.database import (
    safe_find_one_or_404,
    safe_insert_one,
    safe_update_one,
    safe_delete_one,
    safe_find
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'subscription_tracker')]

# Create the main app
app = FastAPI(
    title="Abonnement & Fixkosten Tracker",
    description="API für die Verwaltung von Abonnements und Fixkosten",
    version="1.0.0"
)

# Register exception handlers
app.add_exception_handler(SubTrackException, subtrack_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums
class BillingCycle(str, Enum):
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


# Helper function for ObjectId (deprecated - will be removed in future version)
def str_to_objectid(id_str: str) -> ObjectId:
    """
    Convert string to ObjectId.
    
    .. deprecated::
        Use validators.validate_objectid instead. This function will be removed in version 2.0.
    """
    import warnings
    warnings.warn(
        "str_to_objectid is deprecated. Use validators.validate_objectid instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return validate_objectid(id_str, "Resource")


# Subscription Models
class SubscriptionBase(BaseModel):
    name: str
    category: str
    amount_cents: int = Field(..., gt=0, description="Betrag in Cent")
    billing_cycle: BillingCycle
    start_date: str  # ISO date string
    notes: Optional[str] = None
    cancel_url: Optional[str] = None

    @field_validator('cancel_url')
    @classmethod
    def validate_url(cls, v):
        """Validate cancel URL format."""
        if v is not None and v.strip() != '':
            if not (v.startswith('http://') or v.startswith('https://')):
                raise ValueError('URL muss mit http:// oder https:// beginnen')
        return v
    
    @field_validator('start_date')
    @classmethod
    def validate_start_date(cls, v):
        """Validate start date format."""
        if v:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError('Datumsformat muss YYYY-MM-DD sein')
        return v


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    amount_cents: Optional[int] = Field(None, gt=0)
    billing_cycle: Optional[BillingCycle] = None
    start_date: Optional[str] = None
    notes: Optional[str] = None
    cancel_url: Optional[str] = None


class Subscription(SubscriptionBase):
    id: str
    created_at: datetime


# Expense Models
class ExpenseBase(BaseModel):
    name: str
    category: str
    amount_cents: int = Field(..., gt=0, description="Betrag in Cent")
    billing_cycle: BillingCycle
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    amount_cents: Optional[int] = Field(None, gt=0)
    billing_cycle: Optional[BillingCycle] = None
    notes: Optional[str] = None


class Expense(ExpenseBase):
    id: str
    created_at: datetime


# Dashboard Model
class DashboardSummary(BaseModel):
    monthly_subscriptions: int  # in cents
    monthly_expenses: int  # in cents
    total_monthly: int  # in cents
    yearly_total: int  # in cents
    subscription_count: int
    expense_count: int


# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Abonnement & Fixkosten Tracker API"}


# ===== SUBSCRIPTION ENDPOINTS =====

@api_router.get("/subscriptions", response_model=List[Subscription])
async def get_subscriptions():
    """Alle Abonnements abrufen"""
    try:
        subscriptions = await safe_find(
            db.subscriptions,
            sort_field="name",
            sort_order=1,
            resource_name="Abonnements"
        )
        return [
            Subscription(
                id=str(sub["_id"]),
                name=sub["name"],
                category=sub["category"],
                amount_cents=sub["amount_cents"],
                billing_cycle=sub["billing_cycle"],
                start_date=sub["start_date"],
                notes=sub.get("notes"),
                cancel_url=sub.get("cancel_url"),
                created_at=sub.get("created_at", datetime.utcnow())
            )
            for sub in subscriptions
        ]
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching subscriptions: {str(e)}")
        raise DatabaseError("Fehler beim Abrufen der Abonnements")


@api_router.get("/subscriptions/{subscription_id}", response_model=Subscription)
async def get_subscription(subscription_id: str):
    """Ein Abonnement abrufen"""
    try:
        obj_id = validate_objectid(subscription_id, "Abonnement")
        sub = await safe_find_one_or_404(
            db.subscriptions,
            {"_id": obj_id},
            resource_name="Abonnement",
            resource_id=subscription_id
        )
        return Subscription(
            id=str(sub["_id"]),
            name=sub["name"],
            category=sub["category"],
            amount_cents=sub["amount_cents"],
            billing_cycle=sub["billing_cycle"],
            start_date=sub["start_date"],
            notes=sub.get("notes"),
            cancel_url=sub.get("cancel_url"),
            created_at=sub.get("created_at", datetime.utcnow())
        )
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error fetching subscription {subscription_id}: {str(e)}")
        raise DatabaseError("Fehler beim Abrufen des Abonnements")


@api_router.post("/subscriptions", response_model=Subscription)
async def create_subscription(subscription: SubscriptionCreate):
    """Neues Abonnement erstellen"""
    try:
        sub_dict = subscription.model_dump()
        
        # Sanitize string fields
        sub_dict["name"] = sanitize_string(sub_dict["name"], max_length=200)
        sub_dict["category"] = sanitize_string(sub_dict["category"], max_length=100)
        sub_dict["notes"] = sanitize_string(sub_dict.get("notes"), max_length=1000)
        sub_dict["cancel_url"] = sanitize_string(sub_dict.get("cancel_url"), max_length=500)
        
        # Validate
        if not sub_dict["name"]:
            raise ValidationError("Name darf nicht leer sein")
        if not sub_dict["category"]:
            raise ValidationError("Kategorie darf nicht leer sein")
        
        inserted_id = await safe_insert_one(
            db.subscriptions,
            sub_dict,
            resource_name="Abonnement"
        )
        sub_dict["id"] = inserted_id
        sub_dict["created_at"] = datetime.utcnow()
        return Subscription(**sub_dict)
    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error creating subscription: {str(e)}")
        raise DatabaseError("Fehler beim Erstellen des Abonnements")


@api_router.put("/subscriptions/{subscription_id}", response_model=Subscription)
async def update_subscription(subscription_id: str, subscription: SubscriptionUpdate):
    """Abonnement aktualisieren"""
    try:
        obj_id = validate_objectid(subscription_id, "Abonnement")
        update_data = {k: v for k, v in subscription.model_dump().items() if v is not None}
        
        if not update_data:
            raise ValidationError("Keine Daten zum Aktualisieren")
        
        # Sanitize string fields
        if "name" in update_data:
            update_data["name"] = sanitize_string(update_data["name"], max_length=200)
            if not update_data["name"]:
                raise ValidationError("Name darf nicht leer sein")
        if "category" in update_data:
            update_data["category"] = sanitize_string(update_data["category"], max_length=100)
            if not update_data["category"]:
                raise ValidationError("Kategorie darf nicht leer sein")
        if "notes" in update_data:
            update_data["notes"] = sanitize_string(update_data.get("notes"), max_length=1000)
        if "cancel_url" in update_data:
            update_data["cancel_url"] = sanitize_string(update_data.get("cancel_url"), max_length=500)
        
        await safe_update_one(
            db.subscriptions,
            {"_id": obj_id},
            update_data,
            resource_name="Abonnement",
            resource_id=subscription_id
        )
        
        return await get_subscription(subscription_id)
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error updating subscription {subscription_id}: {str(e)}")
        raise DatabaseError("Fehler beim Aktualisieren des Abonnements")


@api_router.delete("/subscriptions/{subscription_id}")
async def delete_subscription(subscription_id: str):
    """Abonnement löschen"""
    try:
        obj_id = validate_objectid(subscription_id, "Abonnement")
        await safe_delete_one(
            db.subscriptions,
            {"_id": obj_id},
            resource_name="Abonnement",
            resource_id=subscription_id
        )
        return create_success_response(
            data={"id": subscription_id},
            message="Abonnement gelöscht"
        )
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error deleting subscription {subscription_id}: {str(e)}")
        raise DatabaseError("Fehler beim Löschen des Abonnements")


# ===== EXPENSE ENDPOINTS =====

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    """Alle Fixkosten abrufen"""
    try:
        expenses = await safe_find(
            db.expenses,
            sort_field="name",
            sort_order=1,
            resource_name="Fixkosten"
        )
        return [
            Expense(
                id=str(exp["_id"]),
                name=exp["name"],
                category=exp["category"],
                amount_cents=exp["amount_cents"],
                billing_cycle=exp["billing_cycle"],
                notes=exp.get("notes"),
                created_at=exp.get("created_at", datetime.utcnow())
            )
            for exp in expenses
        ]
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching expenses: {str(e)}")
        raise DatabaseError("Fehler beim Abrufen der Fixkosten")


@api_router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(expense_id: str):
    """Eine Fixkosten abrufen"""
    try:
        obj_id = validate_objectid(expense_id, "Fixkosten")
        exp = await safe_find_one_or_404(
            db.expenses,
            {"_id": obj_id},
            resource_name="Fixkosten",
            resource_id=expense_id
        )
        return Expense(
            id=str(exp["_id"]),
            name=exp["name"],
            category=exp["category"],
            amount_cents=exp["amount_cents"],
            billing_cycle=exp["billing_cycle"],
            notes=exp.get("notes"),
            created_at=exp.get("created_at", datetime.utcnow())
        )
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error fetching expense {expense_id}: {str(e)}")
        raise DatabaseError("Fehler beim Abrufen der Fixkosten")


@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    """Neue Fixkosten erstellen"""
    try:
        exp_dict = expense.model_dump()
        
        # Sanitize string fields
        exp_dict["name"] = sanitize_string(exp_dict["name"], max_length=200)
        exp_dict["category"] = sanitize_string(exp_dict["category"], max_length=100)
        exp_dict["notes"] = sanitize_string(exp_dict.get("notes"), max_length=1000)
        
        # Validate
        if not exp_dict["name"]:
            raise ValidationError("Name darf nicht leer sein")
        if not exp_dict["category"]:
            raise ValidationError("Kategorie darf nicht leer sein")
        
        inserted_id = await safe_insert_one(
            db.expenses,
            exp_dict,
            resource_name="Fixkosten"
        )
        exp_dict["id"] = inserted_id
        exp_dict["created_at"] = datetime.utcnow()
        return Expense(**exp_dict)
    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error creating expense: {str(e)}")
        raise DatabaseError("Fehler beim Erstellen der Fixkosten")


@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense: ExpenseUpdate):
    """Fixkosten aktualisieren"""
    try:
        obj_id = validate_objectid(expense_id, "Fixkosten")
        update_data = {k: v for k, v in expense.model_dump().items() if v is not None}
        
        if not update_data:
            raise ValidationError("Keine Daten zum Aktualisieren")
        
        # Sanitize string fields
        if "name" in update_data:
            update_data["name"] = sanitize_string(update_data["name"], max_length=200)
            if not update_data["name"]:
                raise ValidationError("Name darf nicht leer sein")
        if "category" in update_data:
            update_data["category"] = sanitize_string(update_data["category"], max_length=100)
            if not update_data["category"]:
                raise ValidationError("Kategorie darf nicht leer sein")
        if "notes" in update_data:
            update_data["notes"] = sanitize_string(update_data.get("notes"), max_length=1000)
        
        await safe_update_one(
            db.expenses,
            {"_id": obj_id},
            update_data,
            resource_name="Fixkosten",
            resource_id=expense_id
        )
        
        return await get_expense(expense_id)
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error updating expense {expense_id}: {str(e)}")
        raise DatabaseError("Fehler beim Aktualisieren der Fixkosten")


@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    """Fixkosten löschen"""
    try:
        obj_id = validate_objectid(expense_id, "Fixkosten")
        await safe_delete_one(
            db.expenses,
            {"_id": obj_id},
            resource_name="Fixkosten",
            resource_id=expense_id
        )
        return create_success_response(
            data={"id": expense_id},
            message="Fixkosten gelöscht"
        )
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error deleting expense {expense_id}: {str(e)}")
        raise DatabaseError("Fehler beim Löschen der Fixkosten")


# ===== DASHBOARD ENDPOINT =====

@api_router.get("/dashboard", response_model=DashboardSummary)
async def get_dashboard():
    """Dashboard-Übersicht mit Summen"""
    try:
        subscriptions = await safe_find(db.subscriptions, resource_name="Abonnements")
        expenses = await safe_find(db.expenses, resource_name="Fixkosten")
        
        # Calculate monthly amounts
        monthly_subs = 0
        yearly_subs_only = 0
        for sub in subscriptions:
            if sub["billing_cycle"] == "MONTHLY":
                monthly_subs += sub["amount_cents"]
            else:  # YEARLY
                monthly_subs += sub["amount_cents"] // 12
                yearly_subs_only += sub["amount_cents"]
        
        monthly_exps = 0
        yearly_exps_only = 0
        for exp in expenses:
            if exp["billing_cycle"] == "MONTHLY":
                monthly_exps += exp["amount_cents"]
            else:  # YEARLY
                monthly_exps += exp["amount_cents"] // 12
                yearly_exps_only += exp["amount_cents"]
        
        total_monthly = monthly_subs + monthly_exps
        
        # Yearly calculation: monthly * 12 + yearly items
        monthly_only_subs = sum(s["amount_cents"] for s in subscriptions if s["billing_cycle"] == "MONTHLY")
        monthly_only_exps = sum(e["amount_cents"] for e in expenses if e["billing_cycle"] == "MONTHLY")
        yearly_total = (monthly_only_subs + monthly_only_exps) * 12 + yearly_subs_only + yearly_exps_only
        
        return DashboardSummary(
            monthly_subscriptions=monthly_subs,
            monthly_expenses=monthly_exps,
            total_monthly=total_monthly,
            yearly_total=yearly_total,
            subscription_count=len(subscriptions),
            expense_count=len(expenses)
        )
    except DatabaseError:
        raise
    except Exception as e:
        logger.error(f"Error fetching dashboard: {str(e)}")
        raise DatabaseError("Fehler beim Abrufen des Dashboards")


# ===== DEMO DATA ENDPOINT =====

@api_router.post("/demo-data")
async def create_demo_data():
    """Demo-Daten anlegen"""
    # Clear existing data
    await db.subscriptions.delete_many({})
    await db.expenses.delete_many({})
    
    # Demo subscriptions
    demo_subs = [
        {
            "name": "Netflix",
            "category": "Streaming",
            "amount_cents": 1299,
            "billing_cycle": "MONTHLY",
            "start_date": "2024-01-15",
            "notes": "Premium Abo",
            "cancel_url": "https://www.netflix.com/cancelplan",
            "created_at": datetime.utcnow()
        },
        {
            "name": "Spotify",
            "category": "Musik",
            "amount_cents": 999,
            "billing_cycle": "MONTHLY",
            "start_date": "2023-06-01",
            "notes": "Family Plan",
            "cancel_url": "https://www.spotify.com/account",
            "created_at": datetime.utcnow()
        },
        {
            "name": "Amazon Prime",
            "category": "Shopping",
            "amount_cents": 8990,
            "billing_cycle": "YEARLY",
            "start_date": "2024-03-01",
            "notes": "Inkl. Prime Video",
            "cancel_url": "https://www.amazon.de/prime",
            "created_at": datetime.utcnow()
        },
        {
            "name": "Microsoft 365",
            "category": "Software",
            "amount_cents": 6900,
            "billing_cycle": "YEARLY",
            "start_date": "2024-02-15",
            "notes": "Family",
            "cancel_url": "https://account.microsoft.com",
            "created_at": datetime.utcnow()
        }
    ]
    
    # Demo expenses
    demo_exps = [
        {
            "name": "Miete",
            "category": "Wohnen",
            "amount_cents": 85000,
            "billing_cycle": "MONTHLY",
            "notes": "Kaltmiete inkl. Nebenkosten",
            "created_at": datetime.utcnow()
        },
        {
            "name": "Strom",
            "category": "Wohnen",
            "amount_cents": 7500,
            "billing_cycle": "MONTHLY",
            "notes": "Stadtwerke",
            "created_at": datetime.utcnow()
        },
        {
            "name": "Internet",
            "category": "Kommunikation",
            "amount_cents": 3999,
            "billing_cycle": "MONTHLY",
            "notes": "100 Mbit/s",
            "created_at": datetime.utcnow()
        },
        {
            "name": "KFZ-Versicherung",
            "category": "Versicherung",
            "amount_cents": 48000,
            "billing_cycle": "YEARLY",
            "notes": "Vollkasko",
            "created_at": datetime.utcnow()
        },
        {
            "name": "Handyvertrag",
            "category": "Kommunikation",
            "amount_cents": 2999,
            "billing_cycle": "MONTHLY",
            "notes": "10GB Daten",
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.subscriptions.insert_many(demo_subs)
    await db.expenses.insert_many(demo_exps)
    
    return {"message": "Demo-Daten erfolgreich angelegt", "subscriptions": len(demo_subs), "expenses": len(demo_exps)}


# ===== EXPORT ENDPOINTS =====

class ExportData(BaseModel):
    version: str = "1.0"
    exported_at: str
    subscriptions: List[Dict[str, Any]]
    expenses: List[Dict[str, Any]]
    settings: Optional[Dict[str, Any]] = None


class ImportData(BaseModel):
    subscriptions: Optional[List[Dict[str, Any]]] = None
    expenses: Optional[List[Dict[str, Any]]] = None
    merge: bool = False  # If False, replace all data


@api_router.get("/export/json")
async def export_json():
    """Export all data as JSON"""
    subscriptions = await db.subscriptions.find().to_list(1000)
    expenses = await db.expenses.find().to_list(1000)
    settings = await db.settings.find_one({"type": "app_settings"})
    
    # Convert ObjectIds to strings
    for sub in subscriptions:
        sub["id"] = str(sub.pop("_id"))
        if "created_at" in sub and isinstance(sub["created_at"], datetime):
            sub["created_at"] = sub["created_at"].isoformat()
    
    for exp in expenses:
        exp["id"] = str(exp.pop("_id"))
        if "created_at" in exp and isinstance(exp["created_at"], datetime):
            exp["created_at"] = exp["created_at"].isoformat()
    
    export_data = {
        "version": "1.0",
        "app_name": "Abonnement & Fixkosten Tracker",
        "exported_at": datetime.utcnow().isoformat(),
        "subscriptions": subscriptions,
        "expenses": expenses,
        "settings": settings if settings else {}
    }
    
    return JSONResponse(content=export_data)


@api_router.get("/export/csv")
async def export_csv():
    """Export all data as CSV (returns JSON with CSV strings)"""
    subscriptions = await db.subscriptions.find().to_list(1000)
    expenses = await db.expenses.find().to_list(1000)
    
    # Create subscriptions CSV
    sub_output = io.StringIO()
    sub_fields = ["name", "category", "amount_cents", "billing_cycle", "start_date", "notes", "cancel_url"]
    sub_writer = csv.DictWriter(sub_output, fieldnames=sub_fields, extrasaction='ignore')
    sub_writer.writeheader()
    for sub in subscriptions:
        sub_writer.writerow(sub)
    
    # Create expenses CSV
    exp_output = io.StringIO()
    exp_fields = ["name", "category", "amount_cents", "billing_cycle", "notes"]
    exp_writer = csv.DictWriter(exp_output, fieldnames=exp_fields, extrasaction='ignore')
    exp_writer.writeheader()
    for exp in expenses:
        exp_writer.writerow(exp)
    
    return {
        "subscriptions_csv": sub_output.getvalue(),
        "expenses_csv": exp_output.getvalue(),
        "exported_at": datetime.utcnow().isoformat()
    }


@api_router.post("/import/json")
async def import_json(data: ImportData):
    """Import data from JSON backup"""
    imported_subs = 0
    imported_exps = 0
    
    if not data.merge:
        # Clear existing data if not merging
        await db.subscriptions.delete_many({})
        await db.expenses.delete_many({})
    
    if data.subscriptions:
        for sub in data.subscriptions:
            # Remove id field if exists, let MongoDB generate new one
            sub.pop("id", None)
            sub.pop("_id", None)
            if "created_at" not in sub:
                sub["created_at"] = datetime.utcnow()
            elif isinstance(sub["created_at"], str):
                try:
                    sub["created_at"] = datetime.fromisoformat(sub["created_at"].replace("Z", "+00:00"))
                except:
                    sub["created_at"] = datetime.utcnow()
            await db.subscriptions.insert_one(sub)
            imported_subs += 1
    
    if data.expenses:
        for exp in data.expenses:
            exp.pop("id", None)
            exp.pop("_id", None)
            if "created_at" not in exp:
                exp["created_at"] = datetime.utcnow()
            elif isinstance(exp["created_at"], str):
                try:
                    exp["created_at"] = datetime.fromisoformat(exp["created_at"].replace("Z", "+00:00"))
                except:
                    exp["created_at"] = datetime.utcnow()
            await db.expenses.insert_one(exp)
            imported_exps += 1
    
    return {
        "message": "Daten erfolgreich importiert",
        "subscriptions_imported": imported_subs,
        "expenses_imported": imported_exps,
        "merged": data.merge
    }


# ===== SETTINGS ENDPOINTS =====

class AppSettings(BaseModel):
    currency: str = "EUR"
    notification_enabled: bool = True
    notification_time: str = "09:00"  # HH:MM format
    notification_days_before: List[int] = [1, 3, 7]  # Days before renewal
    theme: str = "dark"
    backup_interval: str = "weekly"  # daily, weekly, monthly
    last_backup: Optional[str] = None


@api_router.get("/settings")
async def get_settings():
    """Get app settings"""
    settings = await db.settings.find_one({"type": "app_settings"})
    if not settings:
        # Return default settings
        return AppSettings().model_dump()
    settings.pop("_id", None)
    settings.pop("type", None)
    return settings


@api_router.put("/settings")
async def update_settings(settings: AppSettings):
    """Update app settings"""
    settings_dict = settings.model_dump()
    settings_dict["type"] = "app_settings"
    settings_dict["updated_at"] = datetime.utcnow().isoformat()
    
    await db.settings.update_one(
        {"type": "app_settings"},
        {"$set": settings_dict},
        upsert=True
    )
    return settings_dict


# ===== NOTIFICATION ENDPOINTS =====

class NotificationSettings(BaseModel):
    subscription_id: str
    enabled: bool = True
    days_before: List[int] = [1, 3, 7]
    custom_message: Optional[str] = None


class ScheduledNotification(BaseModel):
    id: str
    subscription_id: str
    subscription_name: str
    scheduled_date: str
    message: str
    type: str  # renewal, trial_end, cancellation


@api_router.get("/notifications/scheduled")
async def get_scheduled_notifications():
    """Get all scheduled notifications for upcoming renewals"""
    subscriptions = await db.subscriptions.find().to_list(1000)
    settings = await db.settings.find_one({"type": "app_settings"})
    
    days_before = [1, 3, 7]  # Default
    if settings and "notification_days_before" in settings:
        days_before = settings["notification_days_before"]
    
    notifications = []
    today = datetime.utcnow().date()
    
    for sub in subscriptions:
        try:
            start_date = datetime.strptime(sub["start_date"], "%Y-%m-%d").date()
            
            # Calculate next renewal date
            if sub["billing_cycle"] == "MONTHLY":
                # Find next occurrence of the day
                next_renewal = today.replace(day=start_date.day)
                if next_renewal <= today:
                    if today.month == 12:
                        next_renewal = next_renewal.replace(year=today.year + 1, month=1)
                    else:
                        next_renewal = next_renewal.replace(month=today.month + 1)
            else:  # YEARLY
                next_renewal = start_date.replace(year=today.year)
                if next_renewal <= today:
                    next_renewal = next_renewal.replace(year=today.year + 1)
            
            # Check if notification should be shown
            days_until = (next_renewal - today).days
            
            for days in days_before:
                if days_until == days:
                    notifications.append({
                        "id": f"{sub['_id']}_{days}",
                        "subscription_id": str(sub["_id"]),
                        "subscription_name": sub["name"],
                        "scheduled_date": next_renewal.isoformat(),
                        "days_until": days_until,
                        "message": f"{sub['name']} wird in {days_until} Tag(en) verlängert",
                        "type": "renewal",
                        "amount_cents": sub["amount_cents"]
                    })
        except Exception as e:
            continue
    
    return {"notifications": notifications, "count": len(notifications)}


@api_router.get("/notifications/subscription/{subscription_id}")
async def get_subscription_notifications(subscription_id: str):
    """Get notification settings for a specific subscription"""
    settings = await db.notification_settings.find_one({"subscription_id": subscription_id})
    if not settings:
        return {"subscription_id": subscription_id, "enabled": True, "days_before": [1, 3, 7]}
    settings.pop("_id", None)
    return settings


@api_router.put("/notifications/subscription/{subscription_id}")
async def update_subscription_notifications(subscription_id: str, settings: NotificationSettings):
    """Update notification settings for a specific subscription"""
    settings_dict = settings.model_dump()
    await db.notification_settings.update_one(
        {"subscription_id": subscription_id},
        {"$set": settings_dict},
        upsert=True
    )
    return settings_dict


# ===== ANALYTICS ENDPOINTS =====

@api_router.get("/analytics/category-breakdown")
async def get_category_breakdown():
    """Get costs broken down by category"""
    subscriptions = await db.subscriptions.find().to_list(1000)
    expenses = await db.expenses.find().to_list(1000)
    
    categories = {}
    
    # Process subscriptions
    for sub in subscriptions:
        cat = sub["category"]
        monthly = sub["amount_cents"] if sub["billing_cycle"] == "MONTHLY" else sub["amount_cents"] // 12
        if cat not in categories:
            categories[cat] = {"monthly": 0, "count": 0, "type": "mixed"}
        categories[cat]["monthly"] += monthly
        categories[cat]["count"] += 1
    
    # Process expenses
    for exp in expenses:
        cat = exp["category"]
        monthly = exp["amount_cents"] if exp["billing_cycle"] == "MONTHLY" else exp["amount_cents"] // 12
        if cat not in categories:
            categories[cat] = {"monthly": 0, "count": 0, "type": "mixed"}
        categories[cat]["monthly"] += monthly
        categories[cat]["count"] += 1
    
    # Convert to list and sort by monthly cost
    result = [
        {"category": cat, "monthly_cents": data["monthly"], "count": data["count"]}
        for cat, data in categories.items()
    ]
    result.sort(key=lambda x: x["monthly_cents"], reverse=True)
    
    return {"categories": result}


@api_router.get("/analytics/top-subscriptions")
async def get_top_subscriptions(limit: int = 5):
    """Get top N most expensive subscriptions"""
    subscriptions = await db.subscriptions.find().to_list(1000)
    
    # Calculate monthly cost for each
    for sub in subscriptions:
        sub["monthly_cost"] = sub["amount_cents"] if sub["billing_cycle"] == "MONTHLY" else sub["amount_cents"] // 12
        sub["id"] = str(sub.pop("_id"))
    
    # Sort and limit
    subscriptions.sort(key=lambda x: x["monthly_cost"], reverse=True)
    
    return {"top_subscriptions": subscriptions[:limit]}


@api_router.delete("/data/all")
async def delete_all_data():
    """Delete all user data (factory reset)"""
    await db.subscriptions.delete_many({})
    await db.expenses.delete_many({})
    await db.notification_settings.delete_many({})
    # Keep settings but reset
    await db.settings.update_one(
        {"type": "app_settings"},
        {"$set": AppSettings().model_dump()},
        upsert=True
    )
    return {"message": "Alle Daten wurden gelöscht"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
