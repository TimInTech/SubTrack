from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'subscription_tracker')]

# Create the main app
app = FastAPI(title="Abonnement & Fixkosten Tracker")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums
class BillingCycle(str, Enum):
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


# Helper function for ObjectId
def str_to_objectid(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except:
        raise HTTPException(status_code=400, detail="Ungültige ID")


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
        if v is not None and v.strip() != '':
            if not (v.startswith('http://') or v.startswith('https://')):
                raise ValueError('URL muss mit http:// oder https:// beginnen')
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
    subscriptions = await db.subscriptions.find().sort("name", 1).to_list(1000)
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


@api_router.get("/subscriptions/{subscription_id}", response_model=Subscription)
async def get_subscription(subscription_id: str):
    """Ein Abonnement abrufen"""
    sub = await db.subscriptions.find_one({"_id": str_to_objectid(subscription_id)})
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement nicht gefunden")
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


@api_router.post("/subscriptions", response_model=Subscription)
async def create_subscription(subscription: SubscriptionCreate):
    """Neues Abonnement erstellen"""
    sub_dict = subscription.model_dump()
    sub_dict["created_at"] = datetime.utcnow()
    result = await db.subscriptions.insert_one(sub_dict)
    sub_dict["id"] = str(result.inserted_id)
    return Subscription(**sub_dict)


@api_router.put("/subscriptions/{subscription_id}", response_model=Subscription)
async def update_subscription(subscription_id: str, subscription: SubscriptionUpdate):
    """Abonnement aktualisieren"""
    update_data = {k: v for k, v in subscription.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Keine Daten zum Aktualisieren")
    
    result = await db.subscriptions.update_one(
        {"_id": str_to_objectid(subscription_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Abonnement nicht gefunden")
    
    return await get_subscription(subscription_id)


@api_router.delete("/subscriptions/{subscription_id}")
async def delete_subscription(subscription_id: str):
    """Abonnement löschen"""
    result = await db.subscriptions.delete_one({"_id": str_to_objectid(subscription_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Abonnement nicht gefunden")
    return {"message": "Abonnement gelöscht"}


# ===== EXPENSE ENDPOINTS =====

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    """Alle Fixkosten abrufen"""
    expenses = await db.expenses.find().sort("name", 1).to_list(1000)
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


@api_router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(expense_id: str):
    """Eine Fixkosten abrufen"""
    exp = await db.expenses.find_one({"_id": str_to_objectid(expense_id)})
    if not exp:
        raise HTTPException(status_code=404, detail="Fixkosten nicht gefunden")
    return Expense(
        id=str(exp["_id"]),
        name=exp["name"],
        category=exp["category"],
        amount_cents=exp["amount_cents"],
        billing_cycle=exp["billing_cycle"],
        notes=exp.get("notes"),
        created_at=exp.get("created_at", datetime.utcnow())
    )


@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    """Neue Fixkosten erstellen"""
    exp_dict = expense.model_dump()
    exp_dict["created_at"] = datetime.utcnow()
    result = await db.expenses.insert_one(exp_dict)
    exp_dict["id"] = str(result.inserted_id)
    return Expense(**exp_dict)


@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense: ExpenseUpdate):
    """Fixkosten aktualisieren"""
    update_data = {k: v for k, v in expense.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Keine Daten zum Aktualisieren")
    
    result = await db.expenses.update_one(
        {"_id": str_to_objectid(expense_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Fixkosten nicht gefunden")
    
    return await get_expense(expense_id)


@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    """Fixkosten löschen"""
    result = await db.expenses.delete_one({"_id": str_to_objectid(expense_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fixkosten nicht gefunden")
    return {"message": "Fixkosten gelöscht"}


# ===== DASHBOARD ENDPOINT =====

@api_router.get("/dashboard", response_model=DashboardSummary)
async def get_dashboard():
    """Dashboard-Übersicht mit Summen"""
    subscriptions = await db.subscriptions.find().to_list(1000)
    expenses = await db.expenses.find().to_list(1000)
    
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
