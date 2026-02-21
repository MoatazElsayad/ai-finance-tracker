"""
Main FastAPI Application - ALL ROUTES IN ONE FILE!
This is the entire backend - easy to understand everything in one place
"""
import sys
import os

# Fix imports - add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, Index
from pydantic import BaseModel, EmailStr, validator
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, time
import httpx
import random
import json
import asyncio
import html
import re
from collections import defaultdict
from time import time as current_time

# Import local modules
from database import get_db, init_database
from models import User, Transaction, Category, Budget, Goal, Investment, MarketRatesCache, SavingsGoal, ShoppingState
from dotenv import load_dotenv
from ocr_utils import parse_receipt
from fastapi import File, UploadFile
import tempfile
import shutil
import io
from typing import Optional, List, Dict
from datetime import date
import re
from typing import Any

load_dotenv(override=True)

# Debug: Print key status (not the key itself)
print(f"DEBUG: OPENROUTER_API_KEY present: {bool(os.getenv('OPENROUTER_API_KEY'))}")
if os.getenv('OPENROUTER_API_KEY'):
    print(f"DEBUG: Key starts with: {os.getenv('OPENROUTER_API_KEY')[:10]}...")

FREE_MODELS = [
    # "openai/gpt-4o-mini",                      # OpenAI    - ChatGPT (Paid)
    # "openai/chatgpt-4o-latest",                # OpenAI    - ChatGPT (paid)
    "openai/gpt-oss-120b:free",
    "google/gemini-2.0-flash-exp:free",          # Google    - Gemini
    "google/gemma-3-27b-it:free",
    "stepfun/step-3.5-flash:free",
    "arcee-ai/trinity-large-preview:free",
    "upstage/solar-pro-3:free",
    "liquid/lfm-2.5-1.2b-thinking:free",
    "liquid/lfm-2.5-1.2b-instruct:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",       # Nvidia    - Nemotron
    "arcee-ai/trinity-mini:free",
    "tngtech/tng-r1t-chimera:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "z-ai/glm-4.5-air:free",
    "qwen/qwen3-coder:free",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    "google/gemma-3n-e2b-it:free",
    "deepseek/deepseek-r1-0528:free",            # DeepSeek  - DeepSeek
    "tngtech/deepseek-r1t2-chimera:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "mistralai/devstral-2512:free",
    "qwen/qwen-2.5-vl-7b-instruct:free",
    "xiaomi/mimo-v2-flash:free"
]

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is missing! Check your .env file.")

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    pbkdf2_sha256__default_rounds=600000
)

app = FastAPI(title="Simple Finance Tracker")

# Allow frontend to connect
# In main.py, update the CORS section to be more permissive for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use "*" temporarily to rule out CORS issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# RATE LIMITING
# ============================================
rate_limit_store = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # 1 minute window
RATE_LIMIT_MAX_REQUESTS = 100  # Max requests per window per IP

def check_rate_limit(request: Request):
    """Simple in-memory rate limiting"""
    client_ip = request.client.host if request.client else "unknown"
    now = current_time()
    
    # Clean old entries
    rate_limit_store[client_ip] = [
        timestamp for timestamp in rate_limit_store[client_ip]
        if now - timestamp < RATE_LIMIT_WINDOW
    ]
    
    # Check limit
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_MAX_REQUESTS} requests per minute."
        )
    
    # Add current request
    rate_limit_store[client_ip].append(now)

# ============================================
# INPUT SANITIZATION
# ============================================
def sanitize_string(value: str, max_length: int = 1000) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not isinstance(value, str):
        return str(value)
    # Remove null bytes
    value = value.replace('\x00', '')
    # HTML escape
    value = html.escape(value)
    # Limit length
    if len(value) > max_length:
        value = value[:max_length]
    return value.strip()

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal"""
    # Remove path components
    filename = os.path.basename(filename)
    # Remove dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    return filename

# Initialize database on startup
@app.on_event("startup")
def startup():
    init_database()


# ============================================
# PYDANTIC SCHEMAS (Request/Response models)
# ============================================

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    phone: str | None = None
    gender: str | None = None
    password: str
    
    @validator('username', 'first_name', 'last_name', 'phone')
    def sanitize_fields(cls, v):
        if v is None:
            return v
        return sanitize_string(str(v), max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if len(v) > 128:
            raise ValueError('Password must be less than 128 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TransactionCreate(BaseModel):
    category_id: int
    amount: float
    description: str
    date: str  # Format: "2026-01-15"
    
    @validator('description')
    def sanitize_description(cls, v):
        return sanitize_string(str(v), max_length=500)
    
    @validator('amount')
    def validate_amount(cls, v):
        if abs(v) > 999999999:  # 999 million max
            raise ValueError('Amount is too large')
        return v
    
    @validator('date')
    def validate_date(cls, v):
        # Validate date format
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
        return v

class TransactionResponse(BaseModel):
    id: int
    amount: float
    description: str
    date: datetime
    category_name: str
    category_icon: str
    
    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    gender: str | None = None
    avatar_seed: str | None = None

class CategoryCreate(BaseModel):
    name: str
    type: str  # "income" or "expense"
    icon: str  # emoji like 🍔
    
    @validator('name')
    def sanitize_name(cls, v):
        return sanitize_string(str(v), max_length=50)
    
    @validator('type')
    def validate_type(cls, v):
        if v not in ['income', 'expense']:
            raise ValueError('Type must be either "income" or "expense"')
        return v
    
    @validator('icon')
    def sanitize_icon(cls, v):
        # Allow emojis and basic characters, limit length
        sanitized = sanitize_string(str(v), max_length=10)
        return sanitized

class InvestmentCreate(BaseModel):
    type: str  # "gold", "silver", "USD", "GBP", "EUR", "SAR", etc.
    amount: float
    buy_price: float | None = None
    buy_date: str | None = None  # Format: "2026-01-15"

class SavingsGoalUpdate(BaseModel):
    monthly_goal: float

class SavingsGoalLongTerm(BaseModel):
    target_amount: float
    target_date: str

class ShoppingStatePayload(BaseModel):
    inventory_items: List[Dict[str, Any]] = []
    shopping_items: List[Dict[str, Any]] = []

class ReportRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    format: str


# ============================================
# HELPER FUNCTIONS
# ============================================

def hash_password(password: str) -> str:
    """Hash a password for storage"""
    # Use pbkdf2_sha256 for new passwords
    return pwd_context.hash(str(password))

def verify_password(plain: str, hashed: str) -> bool:
    """Check if password matches hash"""
    # First try pbkdf2_sha256 (for new hashes)
    try:
        return pwd_context.verify(str(plain), hashed)
    except Exception:
        pass

    # If that fails, try manual bcrypt verification for legacy hashes
    if hashed.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            import bcrypt
            # bcrypt has 72-byte limit, so truncate
            return bcrypt.checkpw(str(plain)[:71].encode('utf-8'), hashed.encode('utf-8'))
        except Exception:
            pass

    return False

def create_token(user_id: int) -> str:
    """Create JWT token for authentication"""
    expire = datetime.utcnow() + timedelta(days=7)
    data = {"sub": str(user_id), "exp": expire}
    return jwt.encode(data, SECRET_KEY, algorithm="HS256")


# Security scheme for Authorization header
security = HTTPBearer(auto_error=False)

def get_token_from_header_or_query(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None
) -> str:
    """
    Get token from Authorization header (preferred) or query parameter (backward compatibility)
    """
    # Try Authorization header first (Bearer token)
    if authorization and authorization.credentials:
        return authorization.credentials
    
    # Fallback to query parameter for backward compatibility
    if token:
        return token
    
    # Try to get from query string if not in function params
    query_token = request.query_params.get("token")
    if query_token:
        return query_token
    
    raise HTTPException(
        status_code=401,
        detail="Authentication required. Please provide a valid token in Authorization header or query parameter."
    )

def get_current_user(
    request: Optional[Request] = None,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from token
    Supports both Authorization header and query parameter for backward compatibility
    """
    try:
        # If the first argument is a string, it's likely a manual call passing the token
        if isinstance(request, str):
            token_value = request
            # In this case, the second argument (authorization) might be the DB session
            if not isinstance(db, Session) and isinstance(authorization, Session):
                db = authorization
        else:
            # Get token from header or query
            token_value = get_token_from_header_or_query(request, authorization, token)
        
        # Decode the token
        payload = jwt.decode(token_value, SECRET_KEY, algorithms=["HS256"])
        user_id_str = payload.get("sub")
        
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Token missing user ID")
            
        user_id = int(user_id_str)
        
        # Find the user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User no longer exists")
            
        return user
    except jwt.ExpiredSignatureError:
        print(f"Auth Error: Token expired for request to {request.url if request else 'unknown'}")
        raise HTTPException(status_code=401, detail="Token has expired. Please login again.")
    except jwt.JWTError as e:
        print(f"Auth Error: JWT Error {e} for request to {request.url if request else 'unknown'}")
        raise HTTPException(status_code=401, detail="Invalid token format")
    except Exception as e:
        print(f"Auth Error: {e} for request to {request.url if request else 'unknown'}")
        raise HTTPException(status_code=401, detail="Authentication failed")


# ============================================
# AUTHENTICATION ROUTES
# ============================================

@app.post("/auth/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check if username is taken
        existing_username = db.query(User).filter(User.username == data.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Explicitly pull the password out
        plain_password = data.password 
        
        user = User(
            email=data.email,
            username=data.username,
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            gender=data.gender,
            hashed_password=hash_password(plain_password)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        token = create_token(user.id)
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        print(f"CRASH IN REGISTER: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Login - returns JWT token
    """
    # Find user
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Debug: show hash format
    hash_preview = user.hashed_password[:50] if user.hashed_password else "None"
    print(f"DEBUG - Hash preview: {hash_preview}")

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Return token
    token = create_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me")
def get_me(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get current user info
    """
    # Note: Skipping rate limit for auth endpoint to avoid issues
    user = get_current_user(request, authorization, token, db)
    # Calculate Total Balance (Sum of all transactions)
    # This represents the Total Net Worth (Liquid + Savings Cash)
    from sqlalchemy import func
    balance = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user.id
    ).scalar() or 0.0
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "gender": user.gender,
        "avatar_seed": user.avatar_seed,
        "available_balance": float(balance),
        "createdAt": user.created_at.isoformat() if user.created_at else None
    }


# ============================================
# TRANSACTION ROUTES
# ============================================

@app.get("/transactions")
def get_transactions(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category_id: Optional[int] = None,
    type: Optional[str] = None, # 'income' or 'expense'
    db: Session = Depends(get_db)
):
    """
    Get transactions for current user with pagination and filters
    """
    check_rate_limit(request)
    user = get_current_user(request, authorization, token, db)
    
    # Validate pagination params
    page = max(1, page)
    limit = min(max(1, limit), 100)  # Max 100 per page
    offset = (page - 1) * limit
    
    # Build query
    query = db.query(Transaction).filter(Transaction.user_id == user.id)
    
    # Apply filters
    if start_date:
        try:
            query = query.filter(Transaction.date >= datetime.fromisoformat(start_date))
        except: pass
    if end_date:
        try:
            # Add time to end_date to include the full day
            end_dt = datetime.fromisoformat(end_date)
            if end_dt.hour == 0 and end_dt.minute == 0:
                end_dt = end_dt.replace(hour=23, minute=59, second=59)
            query = query.filter(Transaction.date <= end_dt)
        except: pass
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if type:
        query = query.join(Category).filter(Category.type == type)
    
    # Get total count before pagination
    total = query.count()
    
    # Get paginated transactions
    transactions = query.options(joinedload(Transaction.category)).order_by(
        Transaction.date.desc(), Transaction.id.desc()
    ).offset(offset).limit(limit).all()
    
    # Format response
    result = []
    for t in transactions:
        # Extra safety check for category
        cat_name = "Uncategorized"
        cat_icon = "📦"
        
        try:
            if t.category is not None:
                cat_name = getattr(t.category, 'name', "Uncategorized")
                cat_icon = getattr(t.category, 'icon', "📦") or "📦"
        except Exception as e:
            print(f"DEBUG: Error accessing category for transaction {t.id}: {e}")
            
        result.append({
            "id": t.id,
            "amount": t.amount,
            "description": t.description,
            "date": t.date.isoformat() if t.date else datetime.utcnow().isoformat(),
            "category_id": t.category_id,
            "category_name": cat_name,
            "category_icon": cat_icon
        })
    
    return {
        "transactions": result,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@app.post("/transactions")
def create_transaction(
    request: Request,
    data: TransactionCreate,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Add a new transaction
    """
    check_rate_limit(request)
    user = get_current_user(request, authorization, token, db)
    
    # 1. Verify if this is a 'Savings' transaction and handle type mismatch
    # In this system, Transaction.amount > 0 is INCOME (increases liquid cash), 
    # and Transaction.amount < 0 is EXPENSE (decreases liquid cash).
    # 
    # Savings Logic:
    # - Deposit to savings: User sends amount > 0. This is an 'expense' from liquid cash,
    #   so we store it as -amount. The vault balance is calculated as -sum(transactions),
    #   so -(-amount) = +amount (vault increases).
    # - Withdrawal from savings: User sends amount < 0. This is 'income' to liquid cash,
    #   so we store it as +abs(amount). The vault balance becomes -sum(..., +abs(amount)),
    #   which decreases the vault balance.
    category = db.query(Category).filter(Category.id == data.category_id).first()
    if category and category.name.lower() == 'savings':
        if data.amount > 0:
            # Deposit: Increase vault, decrease liquid cash
            data.amount = -abs(data.amount)
        else:
            # Withdrawal: Decrease vault, increase liquid cash
            data.amount = abs(data.amount)

    # Create transaction
    transaction = Transaction(
        user_id=user.id,
        category_id=data.category_id,
        amount=data.amount,
        description=data.description,
        date=datetime.fromisoformat(data.date)
    )
    db.add(transaction)
    
    # Update linked savings goals
    linked_goals = db.query(Goal).filter(
        Goal.user_id == user.id,
        Goal.categories.any(id=transaction.category_id)
    ).all()
    
    for goal in linked_goals:
        # Keep one consistent rule for goal progress:
        # positive transaction adds progress, negative subtracts progress.
        goal.current_amount += transaction.amount
            
    db.commit()
    
    return {"message": "Transaction created", "id": transaction.id}


@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    request: Request,
    transaction_id: int,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Delete a transaction
    """
    check_rate_limit(request)
    user = get_current_user(request, authorization, token, db)
    
    # Find transaction
    transaction = db.query(Transaction).options(joinedload(Transaction.category)).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update linked savings goals (reverse the transaction effect)
    linked_goals = db.query(Goal).filter(
        Goal.user_id == user.id,
        Goal.categories.any(id=transaction.category_id)
    ).all()
    
    for goal in linked_goals:
        # Reverse the exact delta previously applied.
        goal.current_amount -= transaction.amount

    db.delete(transaction)
    db.commit()
    
    return {"message": "Transaction deleted"}


@app.put("/transactions/{transaction_id}")
def update_transaction(
    request: Request,
    transaction_id: int,
    data: TransactionCreate,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Update an existing transaction
    """
    check_rate_limit(request)
    user = get_current_user(request, authorization, token, db)
    
    # Find transaction
    transaction = db.query(Transaction).options(joinedload(Transaction.category)).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Handle goal updates (reverse old, add new)
    # Reverse old
    old_category = transaction.category
    old_linked_goals = db.query(Goal).filter(
        Goal.user_id == user.id,
        Goal.categories.any(id=transaction.category_id)
    ).all()
    
    for goal in old_linked_goals:
        goal.current_amount -= transaction.amount

    # Update fields
    transaction.category_id = data.category_id
    transaction.amount = data.amount
    transaction.description = data.description
    transaction.date = datetime.fromisoformat(data.date)
    
    # Add new
    new_category = db.query(Category).filter(Category.id == data.category_id).first()
    new_linked_goals = db.query(Goal).filter(
        Goal.user_id == user.id,
        Goal.categories.any(id=transaction.category_id)
    ).all()
    
    for goal in new_linked_goals:
        goal.current_amount += transaction.amount
            
    db.commit()
    db.refresh(transaction)
    
    return {"message": "Transaction updated", "id": transaction.id}


@app.post("/transactions/bulk-delete")
def bulk_delete_transactions(
    request: Request,
    transaction_ids: List[int],
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Delete multiple transactions at once
    """
    check_rate_limit(request)
    user = get_current_user(request, authorization, token, db)
    
    transactions = db.query(Transaction).filter(
        Transaction.id.in_(transaction_ids),
        Transaction.user_id == user.id
    ).all()
    
    deleted_count = 0
    for transaction in transactions:
        # Reverse goal effects
        linked_goals = db.query(Goal).filter(
            Goal.user_id == user.id,
            Goal.categories.any(id=transaction.category_id)
        ).all()
        
        for goal in linked_goals:
            goal.current_amount -= transaction.amount
        
        db.delete(transaction)
        deleted_count += 1
        
    db.commit()
    
    return {"message": f"Deleted {deleted_count} transactions"}


@app.get("/categories")
def get_categories(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all available categories for the current user.
    Includes only user-specific categories.
    """
    check_rate_limit(request)
    user = get_current_user(request, authorization, token, db)
    
    # Get user's custom categories
    custom_categories = db.query(Category).filter(Category.user_id == user.id).all()
    
    return [
        {
            "id": c.id,
            "name": c.name,
            "type": c.type,
            "icon": c.icon,
            "user_id": c.user_id,
            "is_custom": c.user_id is not None
        }
        for c in custom_categories
    ]


@app.post("/categories")
def create_category(
    request: Request,
    data: CategoryCreate,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Create a custom category for the user
    """
    check_rate_limit(request)
    user = get_current_user(request, authorization, token, db)
    
    # Validate category type
    if data.type not in ["income", "expense"]:
        raise HTTPException(400, "Type must be 'income' or 'expense'")
    
    # Check if category name already exists for this user
    existing = db.query(Category).filter(
        Category.user_id == user.id,
        Category.name.ilike(data.name),
        Category.type == data.type
    ).first()
    
    if existing:
        raise HTTPException(400, "You already have a category with this name")
    
    # Create new category
    category = Category(
        user_id=user.id,
        name=data.name,
        type=data.type,
        icon=data.icon
    )
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return {
        "id": category.id,
        "name": category.name,
        "type": category.type,
        "icon": category.icon,
        "is_custom": True
    }


@app.delete("/categories/{category_id}")
def delete_category(
    request: Request,
    category_id: int,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Delete a custom category (only the user's own categories)
    """
    check_rate_limit(request)
    user = get_current_user(request, authorization, token, db)
    
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user.id
    ).first()
    
    if not category:
        raise HTTPException(404, "Category not found or you don't have permission to delete it")
    
    # Check if category is being used in transactions
    used_in_transactions = db.query(Transaction).filter(
        Transaction.category_id == category_id
    ).count()
    
    if used_in_transactions > 0:
        raise HTTPException(400, f"Cannot delete category - it's used in {used_in_transactions} transaction(s)")
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}


# ============================================
# ANALYTICS ROUTE
# ============================================

def get_monthly_stats_logic(db: Session, user_id: int, year: int, month: int):
    transactions = db.query(Transaction).options(joinedload(Transaction.category)).filter(Transaction.user_id == user_id).all()
    
    monthly_tx = [t for t in transactions if t.date.year == year and t.date.month == month]
    is_savings = lambda t: (t.category and t.category.name and 'savings' in t.category.name.lower())

    # Regular cashflow (exclude internal vault transfers)
    total_income = sum(t.amount for t in monthly_tx if t.amount > 0 and not is_savings(t))
    actual_spending = abs(sum(t.amount for t in monthly_tx if t.amount < 0 and not is_savings(t)))

    # Savings transfers
    savings_deposits = sum(t.amount for t in monthly_tx if is_savings(t) and t.amount > 0)
    savings_withdrawals = abs(sum(t.amount for t in monthly_tx if is_savings(t) and t.amount < 0))
    net_savings_transfers = savings_deposits - savings_withdrawals

    categories = {}
    for t in monthly_tx:
        if t.amount < 0 and not is_savings(t):
            name = t.category.name if t.category else "Uncategorized"
            categories[name] = categories.get(name, 0) + abs(t.amount)
            
    return {
        "total_income": round(total_income, 2),
        "total_expenses": round(actual_spending, 2),
        "total_savings": round(net_savings_transfers, 2),
        "actual_spending": round(actual_spending, 2),
        "net_savings": round(total_income - actual_spending + net_savings_transfers, 2),
        "category_breakdown": [{"name": k, "amount": round(v, 2)} for k, v in categories.items()]
    }

# 2. Update the API Route to use that logic
@app.get("/analytics/monthly")
def get_monthly_analytics(
    year: int, 
    month: int, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, authorization, token, db)
    return get_monthly_stats_logic(db, user.id, year, month)

# 3. Update the Budget Comparison to use that logic (No more token error!)
def get_budget_comparison(db: Session, user_id: int, year: int, month: int):
    actuals = get_monthly_stats_logic(db, user_id, year, month)
    
    budgets = db.query(Budget).options(joinedload(Budget.category)).filter(
        Budget.user_id == user_id,
        Budget.year == year,
        Budget.month == month
    ).all()
    
    budget_map = {b.category.name if b.category else "Uncategorized": b.amount for b in budgets}
    
    comparison = []
    for cat_data in actuals["category_breakdown"]:
        name = cat_data["name"]
        actual = cat_data["amount"]
        budgeted = budget_map.get(name, 0)
        comparison.append({
            "category": name, "actual": actual, "budget": budgeted,
            "status": "Over" if actual > budgeted and budgeted > 0 else "OK"
        })
    return comparison

def build_all_time_financial_context(db: Session, user_id: int):
    """
    Build comprehensive financial context including all historical data
    """
    # 1. Get All Transactions
    all_tx = db.query(Transaction).options(joinedload(Transaction.category)).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.date.asc()).all()

    if not all_tx:
        return None

    is_savings = lambda t: (t.category and t.category.name and 'savings' in t.category.name.lower())

    # 2. Calculate All-Time Totals
    total_income = sum(t.amount for t in all_tx if t.amount > 0 and not is_savings(t))
    total_expenses = abs(sum(t.amount for t in all_tx if t.amount < 0 and not is_savings(t)))
    
    # 3. Monthly Aggregates (for trends)
    monthly_data = {}
    for t in all_tx:
        key = t.date.strftime("%Y-%m")
        if key not in monthly_data:
            monthly_data[key] = {"income": 0, "expenses": 0, "savings": 0}
        
        if is_savings(t):
            monthly_data[key]["savings"] += t.amount
        elif t.amount > 0:
            monthly_data[key]["income"] += t.amount
        else:
            monthly_data[key]["expenses"] += abs(t.amount)

    # 4. Spending by Category (All Time)
    category_spending = {}
    for t in all_tx:
        if t.amount < 0 and not is_savings(t):
            cat_name = t.category.name if t.category else "Uncategorized"
            category_spending[cat_name] = category_spending.get(cat_name, 0) + abs(t.amount)

    top_categories_all_time = sorted(
        [{"name": k, "amount": round(v, 2)} for k, v in category_spending.items()],
        key=lambda x: x["amount"],
        reverse=True
    )[:10]

    # 5. Investments & Assets
    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    investment_summary = [
        {"type": i.type, "amount": i.amount, "buy_price": i.buy_price, "date": i.buy_date.strftime("%Y-%m-%d")} 
        for i in investments
    ]

    # 6. Savings Goals (Long Term Single Goal)
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    goals_summary = [
        {"name": "Long Term Goal", "target": g.target_amount, "date": g.target_date.strftime("%Y-%m-%d") if g.target_date else "None"} 
        for g in goals
    ]

    # 7. Goals (Specific Targets)
    specific_goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    specific_goals_summary = [
        {"name": g.name, "target": g.target_amount, "current": g.current_amount, "date": g.target_date.strftime("%Y-%m-%d") if g.target_date else "None"}
        for g in specific_goals
    ]

    # 8. Shopping List & Inventory
    shopping_state = db.query(ShoppingState).filter(ShoppingState.user_id == user_id).first()
    shopping_list = []
    inventory_list = []
    if shopping_state:
        import json
        try:
            shopping_list = json.loads(shopping_state.shopping_json)
            inventory_list = json.loads(shopping_state.inventory_json)
        except:
            pass

    # 9. Budgets (All Time / Current Active)
    budgets = db.query(Budget).options(joinedload(Budget.category)).filter(Budget.user_id == user_id).all()
    budget_summary = [
        {"category": b.category.name if b.category else "Uncategorized", "amount": b.amount, "month": b.month, "year": b.year}
        for b in budgets
    ]

    return {
        "overview": {
            "total_income": round(total_income, 2),
            "total_expenses": round(total_expenses, 2),
            "net_savings": round(total_income - total_expenses, 2), # Simplified net
            "first_transaction_date": all_tx[0].date.strftime("%Y-%m-%d"),
            "transaction_count": len(all_tx)
        },
        "monthly_history": monthly_data,
        "top_categories_all_time": top_categories_all_time,
        "investments": investment_summary,
        "goals": goals_summary + specific_goals_summary,
        "shopping_list": shopping_list,
        "inventory": inventory_list,
        "budgets": budget_summary
    }

def build_rich_financial_context(db: Session, user_id: int, year: int, month: int):
    """
    Build comprehensive financial context for AI analysis
    """
    # Get current month transactions
    current_month_tx = db.query(Transaction).options(joinedload(Transaction.category)).filter(
        Transaction.user_id == user_id,
        func.extract('year', Transaction.date) == year,
        func.extract('month', Transaction.date) == month
    ).all()
    
    # Get previous month transactions for comparison
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    
    prev_month_tx = db.query(Transaction).options(joinedload(Transaction.category)).filter(
        Transaction.user_id == user_id,
        func.extract('year', Transaction.date) == prev_year,
        func.extract('month', Transaction.date) == prev_month
    ).all()
    
    is_savings = lambda t: (t.category and t.category.name and 'savings' in t.category.name.lower())

    # Calculate current month stats (regular cashflow + explicit vault transfers)
    current_income = sum(t.amount for t in current_month_tx if t.amount > 0 and not is_savings(t))
    current_expenses_all = abs(sum(t.amount for t in current_month_tx if t.amount < 0 and not is_savings(t)))
    # Savings category delta in this period (positive=net deposit, negative=net withdrawal)
    current_savings_from_tx = sum(
        t.amount for t in current_month_tx
        if is_savings(t)
    )
    current_spending = current_expenses_all
    current_net_savings = current_income - current_spending + current_savings_from_tx
    current_savings_rate = (current_net_savings / current_income * 100) if current_income > 0 else 0
    
    # Calculate previous month stats
    prev_income = sum(t.amount for t in prev_month_tx if t.amount > 0 and not is_savings(t))
    prev_expenses_all = abs(sum(t.amount for t in prev_month_tx if t.amount < 0 and not is_savings(t)))
    prev_savings_from_tx = sum(
        t.amount for t in prev_month_tx
        if is_savings(t)
    )
    prev_spending = prev_expenses_all
    prev_net_savings = prev_income - prev_spending + prev_savings_from_tx
    
    # Calculate trends
    income_change = ((current_income - prev_income) / prev_income * 100) if prev_income > 0 else 0
    expense_change = ((current_spending - prev_spending) / prev_spending * 100) if prev_spending > 0 else 0
    savings_change = ((current_net_savings - prev_net_savings) / abs(prev_net_savings) * 100) if prev_net_savings != 0 else 0
    
    # Category breakdown with trends
    current_categories = {}
    prev_categories = {}
    
    for t in current_month_tx:
        if t.amount < 0 and not is_savings(t):
            cat_name = t.category.name if t.category else "Uncategorized"
            current_categories[cat_name] = current_categories.get(cat_name, 0) + abs(t.amount)
    
    for t in prev_month_tx:
        if t.amount < 0 and not is_savings(t):
            cat_name = t.category.name if t.category else "Uncategorized"
            prev_categories[cat_name] = prev_categories.get(cat_name, 0) + abs(t.amount)
    
    # Find biggest changes
    category_changes = []
    for cat in set(list(current_categories.keys()) + list(prev_categories.keys())):
        current = current_categories.get(cat, 0)
        prev = prev_categories.get(cat, 0)
        change = ((current - prev) / prev * 100) if prev > 0 else 100 if current > 0 else 0
        category_changes.append({
            "category": cat,
            "current": current,
            "previous": prev,
            "change_percent": round(change, 1)
        })
    
    # Sort by absolute change
    category_changes.sort(key=lambda x: abs(x["change_percent"]), reverse=True)
    
    # Get budgets
    budgets = db.query(Budget).options(joinedload(Budget.category)).filter(
        Budget.user_id == user_id,
        Budget.year == year,
        Budget.month == month
    ).all()
    
    budget_status = []
    for budget in budgets:
        cat_name = budget.category.name if budget.category else "Uncategorized"
        spent = current_categories.get(cat_name, 0)
        percentage = (spent / budget.amount * 100) if budget.amount > 0 else 0
        status = "over" if spent > budget.amount else "on_track" if percentage > 80 else "good"
        
        budget_status.append({
            "category": cat_name,
            "budgeted": budget.amount,
            "spent": spent,
            "percentage": round(percentage, 1),
            "status": status
        })
    
    # Find unusual transactions (highest expenses)
    unusual_expenses = sorted(
        [t for t in current_month_tx if t.amount < 0 and not is_savings(t)],
        key=lambda x: abs(x.amount),
        reverse=True
    )[:3]
    
    # Count transactions per category
    transaction_frequency = {}
    for t in current_month_tx:
        if t.amount < 0 and not is_savings(t):
            cat_name = t.category.name if t.category else "Uncategorized"
            transaction_frequency[cat_name] = transaction_frequency.get(cat_name, 0) + 1
    
    return {
        "current_month": {
            "income": round(current_income, 2),
            "expenses": round(current_spending, 2), # Net spending (excluding savings)
            "total_expenses_with_savings": round(current_expenses_all, 2),
            "savings": round(current_net_savings, 2), # Net savings (Income - Actual Spending)
            "savings_from_transactions": round(current_savings_from_tx, 2), # The 'Savings' category amount
            "savings_rate": round(current_savings_rate, 1),
            "transaction_count": len(current_month_tx)
        },
        "previous_month": {
            "income": round(prev_income, 2),
            "expenses": round(prev_spending, 2),
            "savings": round(prev_net_savings, 2)
        },
        "trends": {
            "income_change": round(income_change, 1),
            "expense_change": round(expense_change, 1),
            "savings_change": round(savings_change, 1)
        },
        "category_breakdown": sorted(
            [{"name": k, "amount": round(v, 2), "percent": round(v/current_expenses_all*100, 1) if current_expenses_all > 0 else 0} 
             for k, v in current_categories.items()],
            key=lambda x: x["amount"],
            reverse=True
        ),
        "category_changes": category_changes[:5],  # Top 5 changes
        "budget_status": budget_status,
        "unusual_expenses": [
            {
                "description": t.description,
                "amount": abs(t.amount),
                "category": t.category.name if t.category else "Uncategorized",
                "date": t.date.strftime("%Y-%m-%d")
            }
            for t in unusual_expenses
        ],
        "transaction_frequency": transaction_frequency
    }

def build_savings_analysis_context(db: Session, user_id: int):
    """
    Build specialized context for savings and investment analysis
    """
    # 1. Get User and Goals
    user = db.query(User).filter(User.id == user_id).first()
    long_term_goal = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).first()
    
    # 2. Get Savings Category and Cash Balance
    savings_categories = db.query(Category).filter(
        Category.name.ilike("%savings%"),
        (Category.user_id == user_id) | (Category.user_id == None)
    ).all()
    savings_category_ids = [c.id for c in savings_categories]
    
    cash_savings = 0.0
    if savings_category_ids:
        net_savings = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.category_id.in_(savings_category_ids)
        ).scalar() or 0.0
        cash_savings = max(0.0, net_savings)

    # 3. Get Current Month Stats
    now = datetime.utcnow()
    year, month = now.year, now.month
    monthly_stats = build_rich_financial_context(db, user_id, year, month)
    
    # 4. Get Investments
    investments = db.query(Investment).filter(Investment.user_id == user_id).all()
    
    # Fetch real-time rates for valuation
    from main import fetch_real_time_rates # Lazy import if needed, but it's in the same file
    # We'll assume fetch_real_time_rates is available or mock it if needed
    # Actually, we can just pass the rates if we call it from the endpoint
    
    return {
        "monthly_goal": getattr(user, "monthly_savings_goal", 0.0),
        "monthly_saved": monthly_stats["current_month"]["savings_from_transactions"],
        "savings_rate": monthly_stats["current_month"]["savings_rate"],
        "cash_balance": cash_savings,
        "investment_count": len(investments),
        "long_term_goal": {
            "target": long_term_goal.target_amount if long_term_goal else 0,
            "date": long_term_goal.target_date.strftime("%Y-%m-%d") if long_term_goal else "None"
        },
        "asset_allocation": [
            {"type": i.type, "amount": i.amount, "buy_price": i.buy_price} 
            for i in investments
        ],
        "market_context": monthly_stats["trends"]
    }


# ============================================
# AI ROUTES (OpenAI Integration with Real-time Updates)
# ============================================

async def create_ai_progress_generator(db: Session, user_id: int, year: int, month: int):
    """Async generator that yields SSE events for AI model progress"""

    # Get rich context (Current Month)
    context = build_rich_financial_context(db, user_id, year, month)
    
    # Get All-Time Context
    all_time = build_all_time_financial_context(db, user_id)

    if context["current_month"]["transaction_count"] == 0 and (not all_time or all_time["overview"]["transaction_count"] == 0):
        yield f"data: {json.dumps({'type': 'error', 'message': 'No transactions found for this month or historically'})}\n\n"
        return

    # Format lists for summary prompt
    goals_summary_list = "\n".join([f"- {g.get('name', 'Goal')}: Target ${g.get('target', 0):,.2f} (by {g.get('date', 'N/A')})" for g in all_time.get('goals', [])[:5]])
    if not goals_summary_list: goals_summary_list = "- No active savings goals"

    investments_summary_list = "\n".join([f"- {i.get('type', 'Asset')}: {i.get('amount', 0)} units" for i in all_time.get('investments', [])[:5]])
    if not investments_summary_list: investments_summary_list = "- No active investments"

    # NEW: Shopping & Inventory
    shopping_list_data = all_time.get('shopping_list', [])
    shopping_summary = ", ".join([item.get('name', 'Item') for item in shopping_list_data[:5]])
    if not shopping_summary: shopping_summary = "None"
    
    inventory_data = all_time.get('inventory', [])
    inventory_summary = ", ".join([item.get('name', 'Item') for item in inventory_data[:5]])
    if not inventory_summary: inventory_summary = "None"

    # Build comprehensive prompt including historical data
    prompt_text = f"""You are a professional financial advisor analyzing a user's finances. You have access to their entire financial history. Provide a comprehensive but concise analysis.

📊 CURRENT MONTH ({month}/{year}):
- Income: ${context['current_month']['income']:,.2f}
- Expenses: ${context['current_month']['expenses']:,.2f}
- Net Savings: ${context['current_month']['savings']:,.2f}
- Savings Rate: {context['current_month']['savings_rate']}%
- Transactions: {context['current_month']['transaction_count']}

🗓️ ALL-TIME OVERVIEW (Since {all_time['overview']['first_transaction_date'] if all_time else 'N/A'}):
    - Total Income: ${all_time['overview']['total_income']:,.2f}
    - Total Expenses: ${all_time['overview']['total_expenses']:,.2f}
    - Net Worth (Approx): ${all_time['overview']['net_savings']:,.2f}
    - Total Transactions: {all_time['overview']['transaction_count']}

    🎯 SAVINGS GOALS:
    {goals_summary_list}

    📈 INVESTMENTS:
    {investments_summary_list}

    🛒 SHOPPING LIST (Top 5): {shopping_summary}
    📦 INVENTORY (Top 5): {inventory_summary}

    📈 MONTHLY TRENDS (vs Last Month):
- Income: {context['trends']['income_change']:+.1f}%
- Expenses: {context['trends']['expense_change']:+.1f}%
- Savings: {context['trends']['savings_change']:+.1f}%

💰 TOP SPENDING CATEGORIES (This Month):
{chr(10).join([f"- {cat['name']}: ${cat['amount']:,.2f} ({cat['percent']:.1f}%)" for cat in context['category_breakdown'][:5]])}

🏆 TOP SPENDING CATEGORIES (All Time):
{chr(10).join([f"- {cat['name']}: ${cat['amount']:,.2f}" for cat in all_time['top_categories_all_time'][:5]]) if all_time else 'N/A'}

🔥 BIGGEST CATEGORY CHANGES (vs Last Month):
{chr(10).join([f"- {cat['category']}: {cat['change_percent']:+.1f}% (${cat['current']:,.2f} now vs ${cat['previous']:,.2f} before)" for cat in context['category_changes'][:3]])}

{'🎯 BUDGET STATUS:' if context['budget_status'] else ''}
{chr(10).join([f"- {b['category']}: ${b['spent']:,.2f} / ${b['budgeted']:,.2f} ({b['percentage']:.1f}%) - {'⚠️ OVER BUDGET' if b['status'] == 'over' else '✅ On Track' if b['status'] == 'on_track' else '✅ Good'}" for b in context['budget_status']]) if context['budget_status'] else ''}

🚨 LARGEST EXPENSES (This Month):
{chr(10).join([f"- ${exp['amount']:,.2f} - {exp['description']} ({exp['category']}) on {exp['date']}" for exp in context['unusual_expenses'][:3]])}

📊 SPENDING FREQUENCY:
{chr(10).join([f"- {cat}: {count} transactions" for cat, count in sorted(context['transaction_frequency'].items(), key=lambda x: x[1], reverse=True)[:3]])}

PROVIDE A CONCISE ANALYSIS (150-250 words max):
1. **Financial Health** (1-2 sentences) - Assess both current month and overall long-term health.
2. **Key Win** (1 sentence) - One main achievement (current or historical).
3. **Budget Performance** (2-4 sentences) - MUST list categories with budgets. Explicitly state which are OVER budget.
4. **Top 2 Actions** (2 bullet points) - Specific steps based on trends, goals, or investments.

Be direct, encouraging, and specific with numbers. Use 2-3 emojis maximum. Keep it SHORT but DETAILED regarding budgets."""

    # AI Model Loop
    url = "https://openrouter.ai/api/v1/chat/completions"

    # Use globally loaded key instead of re-fetching from os.getenv inside the generator
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    if not api_key:
        print("⚠️  No OPENROUTER_API_KEY found - using mock response for testing")
        yield f"data: {json.dumps({'type': 'trying_model', 'model': 'mock-model-for-testing'})}\n\n"
        await asyncio.sleep(1)
        yield f"data: {json.dumps({'type': 'success', 'model': 'mock-model-for-testing', 'summary': '**Financial Health Assessment**\n\nYour finances look solid with consistent income and reasonable spending patterns.\n\n**Key Achievement**\nYou have maintained good savings habits this month.\n\n**Area for Improvement**\nConsider reducing dining out expenses which are 15% higher than last month.\n\n**Recommended Actions**\n• Set a budget for entertainment expenses\n• Review your subscriptions for unused services', 'context': context})}\n\n"
        return

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8001",
        "X-Title": "Finance Tracker AI",
    }

    MODELS = FREE_MODELS.copy()
    random.shuffle(MODELS)

    for model_id in MODELS:
        # Send "trying" event
        yield f"data: {json.dumps({'type': 'trying_model', 'model': model_id})}\n\n"

        payload = {
            "model": model_id,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a financial advisor. Be CONCISE (150-200 words max). Use clear sections. Be specific with numbers and actionable."
                },
                {
                    "role": "user",
                    "content": prompt_text
                }
            ],
            "max_tokens": 500,
            "temperature": 0.7
        }

        async with httpx.AsyncClient(verify=False) as client:
            try:
                # Increased timeout to 45 seconds for better reliability
                response = await client.post(url, headers=headers, json=payload, timeout=45.0)

                if response.status_code == 200:
                    result = response.json()
                    if 'choices' in result and len(result['choices']) > 0:
                        summary = result['choices'][0]['message']['content']
                        # Send success event
                        yield f"data: {json.dumps({'type': 'success', 'model': model_id, 'summary': summary, 'context': context})}\n\n"
                        return
                    else:
                        print(f"⚠️ Model {model_id} returned 200 but no choices: {result}")
                        yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'empty_response'})}\n\n"
                        continue
                else:
                    error_detail = "Unknown error"
                    try:
                        error_json = response.json()
                        error_detail = error_json.get('error', {}).get('message', response.text)
                    except:
                        error_detail = response.text
                    
                    print(f"⚠️ Model {model_id} failed with status {response.status_code}: {error_detail}")
                    if response.status_code == 429:
                        yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'rate_limited'})}\n\n"
                        await asyncio.sleep(0.5)
                    else:
                        yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'error', 'error': error_detail})}\n\n"
                    continue

            except httpx.TimeoutException:
                # Send timeout event and continue to next model
                print(f"❌ Model {model_id} timed out after 45s")
                yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'timeout'})}\n\n"
                continue

            except Exception as e:
                # Send failed event (error)
                print(f"❌ Model {model_id} error: {str(e)}")
                yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'error', 'error': str(e)})}\n\n"
                continue

    # All models failed
    yield f"data: {json.dumps({'type': 'error', 'message': 'All AI models are currently busy. Please try again in a minute.'})}\n\n"

@app.get("/ai/progress")
async def ai_progress_stream(
    year: int, 
    month: int, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Server-Sent Events endpoint for real-time AI model progress"""
    print(f"🎯 SSE REQUEST RECEIVED: year={year}, month={month}, token_provided={bool(token or (authorization and authorization.credentials))}")

    try:
        user = get_current_user(request, authorization, token, db)
        print(f"✅ SSE: Authenticated user {user.id}")
    except Exception as e:
        print(f"❌ SSE: Authentication failed: {e}")
        return {"error": "Authentication failed"}

    async def safe_generator():
        try:
            async for event in create_ai_progress_generator(db, user.id, year, month):
                yield event
        except Exception as e:
            print(f"SSE Generator Error: {e}")
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'message': f'Server error: {str(e)}'})}\n\n"

    return StreamingResponse(
        safe_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
            "Access-Control-Allow-Methods": "GET",
        }
    )

async def create_savings_ai_progress_generator(db: Session, user_id: int):
    """Async generator that yields SSE events for specialized savings AI progress"""
    
    # Get savings context
    context = build_savings_analysis_context(db, user_id)
    
    # Build a savings-focused prompt
    prompt_text = f"""You are a specialized savings and investment advisor. Analyze the user's progress and provide actionable advice.

🎯 GOALS:
- Monthly Savings Target: EGP {context['monthly_goal']:,.2f}
- Current Monthly Savings: EGP {context['monthly_saved']:,.2f}
- Monthly Savings Rate: {context['savings_rate']}%
- Long-term Target: EGP {context['long_term_goal']['target']:,.2f} (by {context['long_term_goal']['date']})

💰 LIQUIDITY & ASSETS:
- Cash Balance: EGP {context['cash_balance']:,.2f}
- Investment Count: {context['investment_count']}
- Asset Allocation: {json.dumps(context['asset_allocation'])}

📈 MARKET TRENDS:
- Income Change: {context['market_context']['income_change']:+.1f}%
- Expense Change: {context['market_context']['expense_change']:+.1f}%

PROVIDE A CONCISE ANALYSIS (150-200 words max):
1. **Savings Performance** (2 sentences) - How close are they to their monthly goal?
2. **Wealth Building** (2 sentences) - Analysis of their cash vs investments.
3. **Strategic Advice** (2 bullet points) - Specific steps to reach the long-term goal faster.

Be professional, data-driven, and encouraging. Use 1-2 emojis."""

    # AI Model Loop
    url = "https://openrouter.ai/api/v1/chat/completions"

    # Use globally loaded key instead of re-fetching from os.getenv inside the generator
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    if not api_key:
        yield f"data: {json.dumps({'type': 'trying_model', 'model': 'mock-model'})}\n\n"
        await asyncio.sleep(1)
        yield f"data: {json.dumps({'type': 'success', 'model': 'mock-model', 'summary': 'AI analysis is unavailable (No API Key). Your savings rate is ' + str(context['savings_rate']) + '%. Keep going!', 'context': context})}\n\n"
        return

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8001",
        "X-Title": "Finance Tracker Savings AI",
    }

    MODELS = FREE_MODELS.copy()
    random.shuffle(MODELS)

    for model_id in MODELS:
        yield f"data: {json.dumps({'type': 'trying_model', 'model': model_id})}\n\n"

        payload = {
            "model": model_id,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a specialized savings and investment advisor. Be CONCISE (150-200 words max). Use clear sections. Be specific with numbers and actionable."
                },
                {
                    "role": "user",
                    "content": prompt_text
                }
            ],
            "max_tokens": 500,
            "temperature": 0.7
        }

        async with httpx.AsyncClient(verify=False) as client:
            try:
                # Increased timeout to 45 seconds for better reliability
                response = await client.post(url, headers=headers, json=payload, timeout=45.0)
                if response.status_code == 200:
                    result = response.json()
                    if 'choices' in result and len(result['choices']) > 0:
                        summary = result['choices'][0]['message']['content']
                        # Send success event
                        yield f"data: {json.dumps({'type': 'success', 'model': model_id, 'summary': summary, 'context': context})}\n\n"
                        return
                    else:
                        print(f"⚠️ Model {model_id} returned 200 but no choices: {result}")
                        yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'empty_response'})}\n\n"
                        continue
                else:
                    error_detail = "Unknown error"
                    try:
                        error_json = response.json()
                        error_detail = error_json.get('error', {}).get('message', response.text)
                    except:
                        error_detail = response.text
                    
                    print(f"⚠️ Model {model_id} failed with status {response.status_code}: {error_detail}")
                    if response.status_code == 429:
                        yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'rate_limited'})}\n\n"
                        await asyncio.sleep(0.5)
                    else:
                        yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'error', 'error': error_detail})}\n\n"
                    continue
            except httpx.TimeoutException:
                print(f"❌ Savings Model {model_id} timed out after 45s")
                yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'timeout'})}\n\n"
                continue
            except Exception as e:
                print(f"❌ Savings Model {model_id} error: {str(e)}")
                yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'error', 'error': str(e)})}\n\n"
                continue

    yield f"data: {json.dumps({'type': 'error', 'message': 'All AI models are currently busy. Please try again in a minute.'})}\n\n"

@app.get("/ai/savings-progress")
async def ai_savings_progress_stream(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Server-Sent Events endpoint for real-time Savings AI model progress"""
    try:
        user = get_current_user(request, authorization, token, db)
    except Exception:
        return {"error": "Authentication failed"}

    async def safe_generator():
        try:
            async for event in create_savings_ai_progress_generator(db, user.id):
                yield event
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Server error: {str(e)}'})}\n\n"

    return StreamingResponse(
        safe_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
            "Access-Control-Allow-Methods": "GET",
        }
    )

@app.post("/ai/savings-analysis")
async def generate_savings_analysis(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Generate specialized AI analysis for savings and investments
    """
    user = get_current_user(request, authorization, token, db)
    context = build_savings_analysis_context(db, user.id)
    
    # Build a savings-focused prompt
    prompt_text = f"""You are a specialized savings and investment advisor. Analyze the user's progress and provide actionable advice.

🎯 GOALS:
- Monthly Savings Target: EGP {context['monthly_goal']:,.2f}
- Current Monthly Savings: EGP {context['monthly_saved']:,.2f}
- Monthly Savings Rate: {context['savings_rate']}%
- Long-term Target: EGP {context['long_term_goal']['target']:,.2f} (by {context['long_term_goal']['date']})

💰 LIQUIDITY & ASSETS:
- Cash Balance: EGP {context['cash_balance']:,.2f}
- Investment Count: {context['investment_count']}
- Asset Allocation: {json.dumps(context['asset_allocation'])}

📈 MARKET TRENDS:
- Income Change: {context['market_context']['income_change']:+.1f}%
- Expense Change: {context['market_context']['expense_change']:+.1f}%

PROVIDE A CONCISE ANALYSIS (150-200 words max):
1. **Savings Performance** (2 sentences) - How close are they to their monthly goal?
2. **Wealth Building** (2 sentences) - Analysis of their cash vs investments.
3. **Strategic Advice** (2 bullet points) - Specific steps to reach the long-term goal faster.

Be professional, data-driven, and encouraging. Use 1-2 emojis."""

    # Re-use the same model selection logic as the dashboard
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    if not OPENROUTER_API_KEY:
        return {
            "summary": "AI analysis is unavailable (No API Key). Your savings rate is " + str(context['savings_rate']) + "%. Keep going!",
            "context": context,
            "model_used": "mock"
        }

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8001",
        "X-Title": "Finance Tracker AI",
    }
    
    MODELS = FREE_MODELS.copy()
    random.shuffle(MODELS)
    
    for model_id in MODELS:
        payload = {
            "model": model_id,
            "messages": [
                {"role": "system", "content": "You are a savings advisor. Be CONCISE and data-driven."},
                {"role": "user", "content": prompt_text}
            ],
            "max_tokens": 400,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(verify=False) as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=20.0)
                if response.status_code == 200:
                    result = response.json()
                    summary = result['choices'][0]['message']['content']
                    return {
                        "summary": summary,
                        "context": context,
                        "model_used": model_id
                    }
                else:
                    error_detail = "Unknown error"
                    try:
                        error_json = response.json()
                        error_detail = error_json.get('error', {}).get('message', response.text)
                    except:
                        error_detail = response.text
                    print(f"⚠️ Model {model_id} failed with status {response.status_code}: {error_detail}")
                    continue
            except Exception as e:
                print(f"Error with {model_id}: {e}")
                continue
                
    raise HTTPException(status_code=503, detail="AI models busy")

@app.post("/ai/summary")
async def generate_ai_summary(
    year: int, 
    month: int, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, authorization, token, db)
    
    # Get rich context
    context = build_rich_financial_context(db, user.id, year, month)
    
    if context["current_month"]["transaction_count"] == 0:
        return {"summary": "You haven't added any transactions yet for this month! Start tracking to get AI insights."}
    
    # Build comprehensive prompt
    prompt_text = f"""You are a professional financial advisor analyzing a user's finances. Provide a comprehensive but concise analysis.

📊 CURRENT MONTH ({month}/{year}):
- Income: ${context['current_month']['income']:,.2f}
- Expenses: ${context['current_month']['expenses']:,.2f}
- Net Savings: ${context['current_month']['savings']:,.2f}
- Savings Rate: {context['current_month']['savings_rate']}%
- Transactions: {context['current_month']['transaction_count']}

📈 TRENDS (vs Last Month):
- Income: {context['trends']['income_change']:+.1f}%
- Expenses: {context['trends']['expense_change']:+.1f}%
- Savings: {context['trends']['savings_change']:+.1f}%

💰 TOP SPENDING CATEGORIES:
{chr(10).join([f"- {cat['name']}: ${cat['amount']:,.2f} ({cat['percent']:.1f}%)" for cat in context['category_breakdown'][:5]])}

🔥 BIGGEST CATEGORY CHANGES (vs Last Month):
{chr(10).join([f"- {cat['category']}: {cat['change_percent']:+.1f}% (${cat['current']:,.2f} now vs ${cat['previous']:,.2f} before)" for cat in context['category_changes'][:3]])}

{'🎯 BUDGET STATUS:' if context['budget_status'] else ''}
{chr(10).join([f"- {b['category']}: ${b['spent']:,.2f} / ${b['budgeted']:,.2f} ({b['percentage']:.1f}%) - {'⚠️ OVER BUDGET' if b['status'] == 'over' else '✅ On Track' if b['status'] == 'on_track' else '✅ Good'}" for b in context['budget_status']]) if context['budget_status'] else ''}

🚨 LARGEST EXPENSES:
{chr(10).join([f"- ${exp['amount']:,.2f} - {exp['description']} ({exp['category']}) on {exp['date']}" for exp in context['unusual_expenses'][:3]])}

📊 SPENDING FREQUENCY:
{chr(10).join([f"- {cat}: {count} transactions" for cat, count in sorted(context['transaction_frequency'].items(), key=lambda x: x[1], reverse=True)[:3]])}

PROVIDE A CONCISE ANALYSIS (150-250 words max):
1. **Financial Health** (1-2 sentences) - Savings rate assessment
2. **Key Win** (1 sentence) - One main achievement
3. **Budget Performance** (2-4 sentences) - MUST list categories with budgets. Explicitly state which are OVER budget and which are UNDER/ON TRACK with specific numbers (e.g., "Food: $500 budget, $600 spent - OVER by $100").
4. **Top 2 Actions** (2 bullet points) - Specific, actionable steps to save money or optimize spending.

Be direct, encouraging, and specific with numbers. Use 2-3 emojis maximum. Keep it SHORT but DETAILED regarding budgets."""

    # Use globally loaded key instead of re-fetching from os.getenv inside the generator
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    if not api_key:
        print("⚠️  No OPENROUTER_API_KEY found - returning mock response for testing")
        return {
            "summary": "**Financial Health Assessment**\n\nYour finances look solid with consistent income and reasonable spending patterns.\n\n**Key Achievement**\nYou've maintained good savings habits this month.\n\n**Area for Improvement**\nConsider reducing dining out expenses which are 15% higher than last month.\n\n**Recommended Actions**\n• Set a budget for entertainment expenses\n• Review your subscriptions for unused services",
            "context": context,
            "model_used": "mock-model-for-testing"
        }

    # AI Model Loop
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8001",
        "X-Title": "Finance Tracker AI",
    }
    
    MODELS = FREE_MODELS.copy()
    random.shuffle(MODELS)

    errors = []
    for model_id in MODELS:
        print(f"DEBUG: Trying AI model: {model_id}")
        payload = {
            "model": model_id,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a financial advisor. Be CONCISE (150-200 words max). Use clear sections. Be specific with numbers and actionable."
                },
                {
                    "role": "user",
                    "content": prompt_text
                }
            ],
            "max_tokens": 500,
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(verify=False) as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=45.0)
                
                if response.status_code == 200:
                    result = response.json()
                    if 'choices' in result and len(result['choices']) > 0:
                        summary = result['choices'][0]['message']['content']
                        print(f"✅ AI Success with {model_id}")
                        return {
                            "summary": summary,
                            "context": context,
                            "model_used": model_id
                        }
                    else:
                        print(f"⚠️ Model {model_id} returned 200 but no choices: {result}")
                        errors.append(f"{model_id}: Empty response")
                
                else:
                    error_detail = "Unknown error"
                    try:
                        error_json = response.json()
                        error_detail = error_json.get('error', {}).get('message', response.text)
                    except:
                        error_detail = response.text
                    
                    print(f"⚠️ Model {model_id} failed ({response.status_code}): {error_detail}")
                    errors.append(f"{model_id} ({response.status_code}): {error_detail}")
                    
            except Exception as e:
                print(f"❌ Error with {model_id}: {str(e)}")
                errors.append(f"{model_id}: {str(e)}")
                continue
    
    error_msg = " | ".join(errors[-3:]) if errors else "No models responded"
    raise HTTPException(
        status_code=503,
        detail=f"All AI models are busy. Last issues: {error_msg}"
    )

def build_chat_context(db: Session, user_id: int, year: int, month: int) -> Dict[str, Any]:
    base = build_rich_financial_context(db, user_id, year, month)
    all_time = build_all_time_financial_context(db, user_id)  # Add all-time context
    start = date(year, month, 1)
    end = _month_range_end(start)
    tx = _fetch_transactions(db, user_id, start, end)
    tx_list = [
        {
            "date": t.date.strftime("%Y-%m-%d"),
            "amount": t.amount,
            "category": t.category.name if t.category else "Uncategorized",
            "description": t.description or ""
        }
        for t in tx[:50]
    ]
    cats = db.query(Category).filter((Category.user_id == None) | (Category.user_id == user_id)).all()
    cat_list = [{"name": c.name, "type": c.type} for c in cats]
    budgets = db.query(Budget).options(joinedload(Budget.category)).filter(Budget.user_id == user_id, Budget.year == year, Budget.month == month).all()
    bud_list = [{"category": b.category.name if b.category else "Uncategorized", "amount": b.amount} for b in budgets]
    trend = _monthly_trend(db, user_id, 6)
    merchants: Dict[str, float] = {}
    for t in tx:
        d = t.description.lower() if t.description else ""
        if d.startswith("receipt:"):
            m = d.split(":", 1)[1].strip()
            if m:
                merchants[m] = merchants.get(m, 0) + abs(t.amount)
    top_merchants = sorted([{"merchant": m, "spent": v} for m, v in merchants.items()], key=lambda x: x["spent"], reverse=True)[:5]
    return {
        "summary": base,
        "all_time": all_time,  # Include all-time data
        "transactions": tx_list,
        "categories": cat_list,
        "budgets": bud_list,
        "trend": trend,
        "top_merchants": top_merchants,
    }

async def create_ai_chat_progress_generator(db: Session, user_id: int, year: int, month: int, question: str):
    ctx = build_chat_context(db, user_id, year, month)
    # Allow chat even if current month has no transactions, as long as there is some history
    if ctx["summary"]["current_month"]["transaction_count"] == 0 and not ctx["all_time"]:
        yield f"data: {json.dumps({'type': 'error', 'message': 'No financial data found.'})}\n\n"
        return
        
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    if not OPENROUTER_API_KEY:
        yield f"data: {json.dumps({'type': 'trying_model', 'model': 'mock-model-for-testing'})}\n\n"
        await asyncio.sleep(1)
        mock_answer = "Answer: " + (question or "No question provided") + "\n\nContext accessed: budgets, categories, transactions, trend, merchants."
        yield f"data: {json.dumps({'type': 'success', 'model': 'mock-model-for-testing', 'answer': mock_answer})}\n\n"
        return
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8001",
        "X-Title": "Finance Tracker AI",
    }
    MODELS = FREE_MODELS.copy()
    random.shuffle(MODELS)
    
    # Enhanced System Prompt with All-Time Data
    all_time = ctx.get("all_time") or {}
    summary = ctx.get("summary", {})
    current = summary.get("current_month", {})
    
    # Calculate derived values safely
    goals = all_time.get('goals', [])
    if not isinstance(goals, list): goals = []
    
    investments = all_time.get('investments', [])
    if not isinstance(investments, list): investments = []
    
    total_invested = sum(i.get('amount', 0) for i in investments)
    
    # Format lists for prompt
    goals_list = "\n    ".join([f"- {g.get('name', 'Goal')}: Target ${g.get('target', 0):,.2f} (by {g.get('date', 'N/A')})" for g in goals[:10]])
    if not goals_list: goals_list = "- No active savings goals"

    investments_list = "\n    ".join([f"- {i.get('type', 'Asset')}: {i.get('amount', 0)} units (bought at ${i.get('buy_price', 0):,.2f})" for i in investments[:10]])
    if not investments_list: investments_list = "- No active investments"

    # NEW DATA: Shopping List, Inventory, Budgets
    shopping_list_data = all_time.get('shopping_list', [])
    shopping_list_str = "\n    ".join([f"- {item.get('name', 'Item')} (Qty: {item.get('quantity', 1)})" for item in shopping_list_data[:15]])
    if not shopping_list_str: shopping_list_str = "- No active shopping list items"
    
    inventory_data = all_time.get('inventory', [])
    inventory_str = "\n    ".join([f"- {item.get('name', 'Item')} (Qty: {item.get('quantity', 1)})" for item in inventory_data[:15]])
    if not inventory_str: inventory_str = "- No inventory items"
    
    budgets_data = all_time.get('budgets', [])
    budgets_str = "\n    ".join([f"- {b.get('category', 'Category')}: ${b.get('amount', 0):,.2f} (Month: {b.get('month')}/{b.get('year')})" for b in budgets_data[:10]])
    if not budgets_str: budgets_str = "- No active budgets"

    system_prompt = f"""You are a financial assistant with access to the user's entire financial history.
    
    📊 ALL-TIME FINANCIAL OVERVIEW:
    - Total Income: ${all_time.get('overview', {}).get('total_income', 0):,.2f}
    - Total Expenses: ${all_time.get('overview', {}).get('total_expenses', 0):,.2f}
    - Net Worth (Approx): ${all_time.get('overview', {}).get('net_savings', 0):,.2f}
    - Total Transactions: {all_time.get('overview', {}).get('transaction_count', 0)}
    
    🎯 SAVINGS GOALS:
    {goals_list}

    📈 INVESTMENTS:
    {investments_list}
    - Total Invested Value: ${total_invested:,.2f}

    🛒 SHOPPING LIST:
    {shopping_list_str}
    
    📦 INVENTORY:
    {inventory_str}
    
    💰 BUDGETS:
    {budgets_str}

    📅 CURRENT MONTH ({year}-{month:02d}) STATUS:
    - Income: ${current.get('total_income', 0):,.2f}
    - Expenses: ${current.get('total_expenses', 0):,.2f}
    - Savings Rate: {summary.get('savings_rate', 0)}%
    
    Answer the user's question using this comprehensive data. Be specific, concise, and helpful.
    If the user asks about "total" or "history", use the All-Time data.
    If the user asks about "this month" or "recent", use the Current Month data.
    If the user asks about shopping or inventory, use the respective lists.
    """

    prompt = {
        "role": "system",
        "content": system_prompt
    }
    # Build simplified context for chat
    summary = ctx["summary"]["current_month"]
    top_cats = "\n".join([f"- {c['name']}: ${c['amount']:,.2f}" for c in ctx["summary"]["category_breakdown"][:5]])
    
    prompt_content = f"""You are a helpful financial assistant. Answer the user's question about their finances.
    
    📊 CURRENT MONTH DATA:
    - Income: ${summary['income']:,.2f}
    - Expenses: ${summary['expenses']:,.2f}
    - Savings: ${summary['savings']:,.2f}
    - Savings Rate: {summary['savings_rate']}%

    💰 TOP CATEGORIES:
    {top_cats}

    USER QUESTION: {question}

    Provide a clear, specific answer based on the data above. Be concise (under 150 words)."""

    user_msg = {
        "role": "user",
        "content": prompt_content
    }
    for model_id in MODELS:
        yield f"data: {json.dumps({'type': 'trying_model', 'model': model_id})}\n\n"
        payload = {"model": model_id, "messages": [prompt, user_msg], "max_tokens": 500, "temperature": 0.4}
        async with httpx.AsyncClient(verify=False) as client:
            try:
                # Increased timeout to 45 seconds for better reliability
                response = await client.post(url, headers=headers, json=payload, timeout=45.0)
                if response.status_code == 200:
                    result = response.json()
                    if 'choices' in result and len(result['choices']) > 0:
                        answer = result["choices"][0]["message"]["content"]
                        yield f"data: {json.dumps({'type': 'success', 'model': model_id, 'answer': answer})}\n\n"
                        return
                    else:
                        print(f"⚠️ Model {model_id} returned 200 but no choices: {result}")
                        yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'empty_response'})}\n\n"
                        continue
                else:
                    error_detail = "Unknown error"
                    try:
                        error_json = response.json()
                        error_detail = error_json.get('error', {}).get('message', response.text)
                    except:
                        error_detail = response.text
                    
                    print(f"⚠️ Model {model_id} failed with status {response.status_code}: {error_detail}")
                    if response.status_code == 429:
                        yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'rate_limited'})}\n\n"
                        await asyncio.sleep(0.5)
                    else:
                        yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'error', 'error': error_detail})}\n\n"
                    continue
            except httpx.TimeoutException:
                print(f"❌ Chat Model {model_id} timed out after 45s")
                yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'timeout'})}\n\n"
                continue
            except Exception as e:
                print(f"❌ Chat Model {model_id} error: {str(e)}")
                yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'error', 'error': str(e)})}\n\n"
                continue
    yield f"data: {json.dumps({'type': 'error', 'message': 'All AI models are currently busy. Please try again in a minute.'})}\n\n"

@app.get("/ai/chat_progress")
async def ai_chat_progress_stream(
    year: int, 
    month: int, 
    question: str, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        user = get_current_user(request, authorization, token, db)
    except Exception:
        return {"error": "Authentication failed"}
    async def safe_generator():
        try:
            async for event in create_ai_chat_progress_generator(db, user.id, year, month, question):
                yield event
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'Server error: {str(e)}'})}\n\n"
    return StreamingResponse(
        safe_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
            "Access-Control-Allow-Methods": "GET",
        }
    )

class ChatRequest(BaseModel):
    question: str

@app.post("/ai/chat")
async def ai_chat(
    year: int, 
    month: int, 
    data: ChatRequest, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, authorization, token, db)
    ctx = build_chat_context(db, user.id, year, month)
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    if not OPENROUTER_API_KEY:
        answer = "Answer: " + (data.question or "No question") + "\n\nContext accessed: budgets, categories, transactions, trend, merchants."
        return {"answer": answer, "model_used": "mock-model-for-testing"}
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8001",
        "X-Title": "Finance Tracker AI",
    }
    MODELS = FREE_MODELS.copy()
    random.shuffle(MODELS)
    prompt = {"role": "system", "content": "You are a financial assistant. Answer precisely using provided data."}
    user_msg = {"role": "user", "content": json.dumps({"question": data.question, "data": ctx})}
    for model_id in MODELS:
        payload = {"model": model_id, "messages": [prompt, user_msg], "max_tokens": 600, "temperature": 0.4}
        async with httpx.AsyncClient(verify=False) as client:
            try:
                resp = await client.post(url, headers=headers, json=payload, timeout=25.0)
                if resp.status_code == 200:
                    res = resp.json()
                    ans = res["choices"][0]["message"]["content"]
                    return {"answer": ans, "model_used": model_id}
                elif resp.status_code == 429:
                    continue
            except Exception:
                continue
    raise HTTPException(status_code=503, detail="All AI models are currently busy. Please try again in a minute.")

@app.post("/categories/init-savings")
async def init_savings_category(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Initialize a 'Savings' category for the current user.
    This is called when the user clicks 'Open Savings Bank'.
    """
    try:
        user = get_current_user(request, authorization, token, db)
        
        # Prefer user-specific savings category.
        existing = db.query(Category).filter(
            Category.user_id == user.id,
            Category.name.ilike("savings")
        ).first()
        
        if existing:
            return {
                "id": existing.id,
                "name": existing.name,
                "type": existing.type,
                "icon": existing.icon,
                "is_custom": existing.user_id is not None,
                "message": "Savings category already exists"
            }
        
        # Create a user-specific Savings category so frontend category list always includes it.
        category = Category(
            user_id=user.id,
            name="Savings",
            type="expense",
            icon="🏦"
        )
        
        db.add(category)
        db.commit()
        db.refresh(category)
        
        return {
            "id": category.id,
            "name": category.name,
            "type": category.type,
            "icon": category.icon,
            "is_custom": True,
            "message": "Savings category created successfully"
        }
    except Exception as e:
        print(f"ERROR in init_savings_category: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# ============================================
# SAVINGS & INVESTMENT ROUTES
# ============================================

# Global cache for rates to avoid hitting API limits
RATES_CACHE = {
    "data": None,
    "timestamp": None
}

METALS_API_KEY = os.getenv("METALS_API_KEY")
EXCHANGE_RATE_API_KEY = os.getenv("EXCHANGE_RATE_API_KEY")

async def fetch_real_time_rates(db: Session, force_refresh: bool = False):
    """
    Fetch gold, silver, and currency rates in EGP.
    Uses database cache if available and not expired (8 hours).
    Scheduled updates: 8 AM, 2 PM, 8 PM EET (UTC+2)
    """
    # EET is UTC+2
    now_utc = datetime.utcnow()
    now_eet = now_utc + timedelta(hours=2)
    
    # 1. Try to get from database cache first
    cached_record = db.query(MarketRatesCache).order_by(MarketRatesCache.updated_at.desc()).first()
    
    should_refresh = force_refresh
    
    if not should_refresh and cached_record and cached_record.updated_at:
        # NEW LOGIC: Refresh on every "reload" (actually every 10 minutes)
        # We removed the strict 3x/day schedule because we are using a free public source.
        # This makes the data feel live while still avoiding hammering the API on every single click.
        cache_age_seconds = (now_utc - cached_record.updated_at).total_seconds()
        if cache_age_seconds > 600: # 10 minutes
            should_refresh = True

    if not should_refresh and cached_record:
        return {
            "gold": cached_record.gold_egp_per_gram,
            "silver": cached_record.silver_egp_per_gram,
            "usd": cached_record.usd_to_egp,
            "gbp": cached_record.gbp_to_egp,
            "eur": cached_record.eur_to_egp,
            "sar": cached_record.sar_to_egp,
            "aed": cached_record.aed_to_egp,
            "kwd": cached_record.kwd_to_egp,
            "qar": cached_record.qar_to_egp,
            "bhd": cached_record.bhd_to_egp,
            "omr": cached_record.omr_to_egp,
            "jod": cached_record.jod_to_egp,
            "try": cached_record.try_to_egp,
            "cad": cached_record.cad_to_egp,
            "aud": cached_record.aud_to_egp,
            "egp": 1.0,
            "last_updated": cached_record.updated_at.isoformat() if cached_record.updated_at else now_utc.isoformat(),
            "is_cached": True
        }

    # Default fallback rates if API fails and no cache exists
    # Updated to match current market rates from GoldPrice.org
    rates_data = {
        "gold": 7589.72,
        "silver": 116.46,
        "usd": 48.9, "eur": 52.8, "gbp": 62.1,
        "sar": 13.0, "aed": 13.3, "kwd": 158.0,
        "qar": 13.4, "bhd": 129.0, "omr": 127.0,
        "jod": 69.0, "try": 1.6, "cad": 36.0, "aud": 32.0,
        "egp": 1.0
    }
    
    # If we have a cached record, use its values as fallback
    if cached_record:
        rates_data.update({
            "gold": cached_record.gold_egp_per_gram,
            "silver": cached_record.silver_egp_per_gram,
            "usd": cached_record.usd_to_egp,
            "gbp": cached_record.gbp_to_egp,
            "eur": cached_record.eur_to_egp,
            "sar": cached_record.sar_to_egp or rates_data["sar"],
            "aed": cached_record.aed_to_egp or rates_data["aed"],
            "kwd": cached_record.kwd_to_egp or rates_data["kwd"],
            "qar": cached_record.qar_to_egp or rates_data["qar"],
            "bhd": cached_record.bhd_to_egp or rates_data["bhd"],
            "omr": cached_record.omr_to_egp or rates_data["omr"],
            "jod": cached_record.jod_to_egp or rates_data["jod"],
            "try": cached_record.try_to_egp or rates_data["try"],
            "cad": cached_record.cad_to_egp or rates_data["cad"],
            "aud": cached_record.aud_to_egp or rates_data["aud"],
        })

    try:
        async with httpx.AsyncClient() as client:
            # 1. Gold (Coinbase PAXG-EGP) - Extremely reliable, free, and no-captcha
            try:
                gold_url = "https://api.coinbase.com/v2/prices/PAXG-EGP/spot"
                async with httpx.AsyncClient(timeout=10.0) as cb_client:
                    gold_resp = await cb_client.get(gold_url)
                    if gold_resp.status_code == 200:
                        gold_json = gold_resp.json()
                        if "data" in gold_json and "amount" in gold_json["data"]:
                            ounce_to_gram = 31.1035
                            gold_price_ounce = float(gold_json["data"]["amount"])
                            rates_data["gold"] = round(gold_price_ounce / ounce_to_gram, 2)
                            print(f"Successfully fetched Gold rate from Coinbase: {rates_data['gold']} EGP/g")
            except Exception as e:
                print(f"Coinbase Gold API failed: {e}")

            # 2. Silver & Fallback Gold (GoldPrice.org)
            try:
                gp_url = "https://data-asg.goldprice.org/dbXRates/EGP"
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
                async with httpx.AsyncClient(verify=False, headers=headers, timeout=15.0) as gp_client:
                    gp_resp = await gp_client.get(gp_url)
                    if gp_resp.status_code == 200:
                        gp_json = gp_resp.json()
                        if "items" in gp_json and len(gp_json["items"]) > 0:
                            item = gp_json["items"][0]
                            ounce_to_gram = 31.1035
                            # Only update gold if Coinbase failed or if this is more recent
                            if "xauPrice" in item and rates_data["gold"] == 7589.72:
                                rates_data["gold"] = round(item["xauPrice"] / ounce_to_gram, 2)
                            if "xagPrice" in item:
                                rates_data["silver"] = round(item["xagPrice"] / ounce_to_gram, 2)
                            print(f"Successfully fetched rates from GoldPrice: Gold={rates_data['gold']}, Silver={rates_data['silver']}")
                    else:
                        print(f"GoldPrice API returned status {gp_resp.status_code} (Likely blocked by captcha)")
            except Exception as gp_err:
                print(f"GoldPrice API failed: {gp_err}")

            # 2. Currencies (ExchangeRate-API) - Needs Key
            if EXCHANGE_RATE_API_KEY:
                try:
                    currency_url = f"https://v6.exchangerate-api.com/v6/{EXCHANGE_RATE_API_KEY}/latest/EGP"
                    currency_resp = await client.get(currency_url, timeout=10.0)
                    if currency_resp.status_code == 200:
                        currency_json = currency_resp.json()
                        if currency_json.get("result") == "success" and "conversion_rates" in currency_json:
                            conv = currency_json.get("conversion_rates", {})
                            for curr in ["USD", "EUR", "GBP", "SAR", "AED", "KWD", "QAR", "BHD", "OMR", "JOD", "TRY", "CAD", "AUD"]:
                                if conv.get(curr):
                                    rates_data[curr.lower()] = round(1 / conv[curr], 2)
                except Exception as ce:
                    print(f"Currency API failed: {ce}")

            # 3. Metals-API Fallback (Only if Gold/Silver failed and we have a key)
            # Trigger if gold or silver are still at their default hardcoded values
            if METALS_API_KEY and (rates_data["gold"] == 7589.72 or rates_data["silver"] == 116.46):
                try:
                    # Requesting with base=EGP to get rates directly in Egyptian Pounds
                    metals_url = f"https://metals-api.com/api/latest?access_key={METALS_API_KEY}&base=EGP&symbols=XAU,XAG"
                    metals_resp = await client.get(metals_url, timeout=10.0)
                    if metals_resp.status_code == 200:
                        metals_json = metals_resp.json()
                        if metals_json.get("success") and "rates" in metals_json:
                            # Rates are in 1 unit of metal per X units of EGP (since base is EGP)
                            # Actually, Metals-API usually returns 1 base = X symbols.
                            # So 1 EGP = X XAU. We want 1 XAU in EGP, which is 1/X.
                            ounce_to_gram = 31.1035
                            rate_xau = metals_json["rates"].get("XAU") # 1 EGP = ? XAU
                            rate_xag = metals_json["rates"].get("XAG") # 1 EGP = ? XAG
                            
                            if rate_xau and rate_xau > 0:
                                gold_egp_ounce = 1 / rate_xau
                                rates_data["gold"] = round(gold_egp_ounce / ounce_to_gram, 2)
                            if rate_xag and rate_xag > 0:
                                silver_egp_ounce = 1 / rate_xag
                                rates_data["silver"] = round(silver_egp_ounce / ounce_to_gram, 2)
                            print(f"Successfully fetched direct EGP rates from Metals-API: Gold={rates_data['gold']}")
                except Exception as me:
                    print(f"Metals-API fallback failed: {me}")
            
        # Update database cache
        new_cache = MarketRatesCache(
            gold_egp_per_gram=rates_data["gold"],
            silver_egp_per_gram=rates_data["silver"],
            usd_to_egp=rates_data["usd"],
            gbp_to_egp=rates_data["gbp"],
            eur_to_egp=rates_data["eur"],
            sar_to_egp=rates_data.get("sar"),
            aed_to_egp=rates_data.get("aed"),
            kwd_to_egp=rates_data.get("kwd"),
            qar_to_egp=rates_data.get("qar"),
            bhd_to_egp=rates_data.get("bhd"),
            omr_to_egp=rates_data.get("omr"),
            jod_to_egp=rates_data.get("jod"),
            try_to_egp=rates_data.get("try"),
            cad_to_egp=rates_data.get("cad"),
            aud_to_egp=rates_data.get("aud"),
            updated_at=now_utc
        )
        db.add(new_cache)
        db.commit()
        
        return {**rates_data, "last_updated": now_utc.isoformat(), "is_cached": False}

    except Exception as e:
        print(f"Error fetching real-time rates: {e}")
        # Return whatever we have (cache or defaults)
        return {
            **rates_data, 
            "last_updated": (cached_record.updated_at.isoformat() if cached_record.updated_at else now_utc.isoformat()) if cached_record else now_utc.isoformat(),
            "is_cached": True,
            "error": str(e)
        }

@app.get("/savings/rates")
async def get_savings_rates(request: Request, force: bool = False, db: Session = Depends(get_db)):
    """Public endpoint for rates (DB cached)"""
    check_rate_limit(request)
    return await fetch_real_time_rates(db, force_refresh=force)

@app.get("/savings")
async def get_savings(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    force: bool = False,
    db: Session = Depends(get_db)
):
    try:
        user = get_current_user(request, authorization, token, db)
        print(f"DEBUG: get_savings for user {user.id}, force={force}")
        
        # 1. Get Real-time Rates
        rates = await fetch_real_time_rates(db, force_refresh=force)
        
        # 2. Calculate Cash Balance from Transactions
        # NEW LOGIC: Deposits are positive, Withdrawals are negative.
        # This aligns with the "Total Net Worth = sum(all transactions)" model.
        savings_categories = db.query(Category).filter(
            Category.name.ilike("%savings%"),
            (Category.user_id == user.id) | (Category.user_id == None)
        ).all()
        savings_category_ids = [c.id for c in savings_categories]
        
        cash_savings = 0.0
        if savings_category_ids:
            net_savings = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user.id,
                Transaction.category_id.in_(savings_category_ids)
            ).scalar() or 0.0
            cash_savings = max(0.0, net_savings)

        # 3. Get Investments
        investments = db.query(Investment).filter(Investment.user_id == user.id).all()
        
        # 4. Monthly Savings Allocation for current month
        # NEW LOGIC: Positive transactions to savings category are deposits.
        now = datetime.utcnow()
        current_month_start = datetime(now.year, now.month, 1)
        
        monthly_saved = 0.0
        if savings_category_ids:
            monthly_net = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user.id,
                Transaction.category_id.in_(savings_category_ids),
                Transaction.date >= current_month_start,
            ).scalar() or 0.0
            monthly_saved = float(max(0.0, monthly_net))

        # 5. Long-term Savings Goal
        long_term_goal = db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id).first()
        goal_data = None
        if long_term_goal:
            goal_data = {
                "target_amount": long_term_goal.target_amount,
                "target_date": long_term_goal.target_date.isoformat() if long_term_goal.target_date else None,
                "created_at": long_term_goal.created_at.isoformat() if long_term_goal.created_at else None
            }

        # 6. Rate History (last 7 days)
        seven_days_ago = now - timedelta(days=7)
        history_records = db.query(MarketRatesCache).filter(
            MarketRatesCache.updated_at >= seven_days_ago
        ).order_by(MarketRatesCache.updated_at.asc()).all()
        
        daily_history = {}
        for rec in history_records:
            if not rec.updated_at:
                continue
            date_str = rec.updated_at.date().isoformat()
            daily_history[date_str] = {
                "gold": rec.gold_egp_per_gram,
                "silver": rec.silver_egp_per_gram,
                "usd": rec.usd_to_egp,
                "gbp": rec.gbp_to_egp,
                "eur": rec.eur_to_egp,
                "date": date_str
            }

        return {
            "cash_balance": cash_savings,
            "investments": [
                {
                    "id": i.id,
                    "type": i.type,
                    "amount": i.amount,
                    "buy_price": i.buy_price,
                    "buy_date": i.buy_date.isoformat() if i.buy_date else None,
                    "current_rate": rates.get(i.type.lower(), 0),
                    "current_value": i.amount * rates.get(i.type.lower(), 0)
                } for i in investments
            ],
            "monthly_goal": getattr(user, "monthly_savings_goal", 0.0),
            "monthly_saved": monthly_saved,
            "rates": rates,
            "long_term_goal": goal_data,
            "rate_history": list(daily_history.values())
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_savings: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/investments")
async def add_investment(
    data: InvestmentCreate, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        user = get_current_user(request, authorization, token, db)
        
        # Fetch current rates to get the automatic buy price
        rates = await fetch_real_time_rates(db)
        
        # Use provided buy_price or fetch from live rates
        buy_price = data.buy_price
        if buy_price is None or buy_price <= 0:
            # Check if the type matches one of our currencies or metals
            inv_type = data.type.lower()
            buy_price = rates.get(inv_type, 0.0)
            
            # If still not found, try uppercase (some might be stored that way)
            if buy_price <= 0:
                buy_price = rates.get(data.type.upper(), 0.0)
                
            # Last resort fallback if both fail
            if buy_price <= 0:
                # Look for common mappings
                mapping = {
                    "gold": "gold",
                    "silver": "silver",
                    "usd": "usd",
                    "eur": "eur",
                    "gbp": "gbp",
                    "sar": "sar",
                    "aed": "aed",
                    "kwd": "kwd"
                }
                mapped_key = mapping.get(inv_type)
                if mapped_key:
                    buy_price = rates.get(mapped_key, 0.0)
        
        try:
            buy_date = datetime.strptime(data.buy_date, "%Y-%m-%d") if data.buy_date else datetime.utcnow()
        except:
            buy_date = datetime.utcnow()
            
        investment = Investment(
            user_id=user.id,
            type=data.type,
            amount=data.amount,
            buy_price=buy_price,
            buy_date=buy_date
        )
        db.add(investment)
        
        # DEDUCT FROM CASH SAVINGS:
        # Create a transaction in the "Savings" category to reflect the purchase cost.
        # This decreases the cash_balance while the investment record increases the portfolio value.
        savings_category = db.query(Category).filter(
            Category.name.ilike("%savings%"),
            (Category.user_id == user.id) | (Category.user_id == None)
        ).first()
        
        if savings_category:
            cost = float(data.amount * buy_price)
            # Negative amount indicates money leaving cash savings to buy an asset
            purchase_transaction = Transaction(
                user_id=user.id,
                category_id=savings_category.id,
                amount=-cost,
                description=f"Investment Purchase: {data.amount} {data.type} @ {buy_price}",
                date=buy_date
            )
            db.add(purchase_transaction)
        
        db.commit()
        db.refresh(investment)
        return investment
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in add_investment: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/investments/{investment_id}")
def delete_investment(
    investment_id: int, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        user = get_current_user(request, authorization, token, db)
        investment = db.query(Investment).filter(
            Investment.id == investment_id,
            Investment.user_id == user.id
        ).first()
        
        if not investment:
            raise HTTPException(status_code=404, detail="Investment not found")
            
        db.delete(investment)
        db.commit()
        return {"message": "Investment deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in delete_investment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/users/me/savings-goal")
def update_savings_goal(
    data: SavingsGoalUpdate, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        user = get_current_user(request, authorization, token, db)
        user.monthly_savings_goal = data.monthly_goal
        db.commit()
        return {"message": "Savings goal updated", "monthly_goal": user.monthly_savings_goal}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in update_savings_goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/savings/long-term-goal")
def set_long_term_goal(
    data: SavingsGoalLongTerm, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        user = get_current_user(request, authorization, token, db)
        
        # Check if already exists
        existing = db.query(SavingsGoal).filter(SavingsGoal.user_id == user.id).first()
        
        target_date = None
        if data.target_date:
            try:
                target_date = datetime.strptime(data.target_date, "%Y-%m-%d")
            except:
                pass
                
        if existing:
            existing.target_amount = data.target_amount
            existing.target_date = target_date
            db.commit()
            db.refresh(existing)
            return existing
        else:
            new_goal = SavingsGoal(
                user_id=user.id,
                target_amount=data.target_amount,
                target_date=target_date,
                created_at=datetime.utcnow()
            )
            db.add(new_goal)
            db.commit()
            db.refresh(new_goal)
            return new_goal
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in set_long_term_goal: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/shopping/state")
def get_shopping_state(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        user = get_current_user(request, authorization, token, db)
        state = db.query(ShoppingState).filter(ShoppingState.user_id == user.id).first()
        if not state:
            return {"inventory_items": [], "shopping_items": [], "updated_at": None}

        try:
            inventory_items = json.loads(state.inventory_json or "[]")
        except Exception:
            inventory_items = []

        try:
            shopping_items = json.loads(state.shopping_json or "[]")
        except Exception:
            shopping_items = []

        return {
            "inventory_items": inventory_items,
            "shopping_items": shopping_items,
            "updated_at": state.updated_at.isoformat() if state.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_shopping_state: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/shopping/state")
def save_shopping_state(
    data: ShoppingStatePayload,
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        user = get_current_user(request, authorization, token, db)
        state = db.query(ShoppingState).filter(ShoppingState.user_id == user.id).first()

        inventory_json = json.dumps(data.inventory_items or [])
        shopping_json = json.dumps(data.shopping_items or [])

        if state:
            state.inventory_json = inventory_json
            state.shopping_json = shopping_json
            state.updated_at = datetime.utcnow()
        else:
            state = ShoppingState(
                user_id=user.id,
                inventory_json=inventory_json,
                shopping_json=shopping_json,
                updated_at=datetime.utcnow()
            )
            db.add(state)

        db.commit()
        db.refresh(state)
        return {
            "message": "Shopping state saved",
            "updated_at": state.updated_at.isoformat() if state.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in save_shopping_state: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# BUDGET ROUTES (Add these to main.py)
# ============================================

class BudgetCreate(BaseModel):
    category_id: int
    amount: float
    month: int
    year: int

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    target_date: str
    category_ids: List[int] = []

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[str] = None
    category_ids: Optional[List[int]] = None

@app.get("/budgets")
def get_budgets(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    year: int = None, 
    month: int = None, 
    db: Session = Depends(get_db)
):
    """Get budgets for current user, optionally filtered by month/year"""
    user = get_current_user(request, authorization, token, db)

    query = db.query(Budget).filter(Budget.user_id == user.id)

    if year is not None and month is not None:
        query = query.filter(Budget.year == year, Budget.month == month)

    budgets = query.all()

    return [
        {
            "id": b.id,
            "category_id": b.category_id,
            "category": {
                "id": b.category.id if b.category else b.category_id,
                "name": b.category.name if b.category else "Uncategorized",
                "icon": b.category.icon if b.category else "📦",
                "type": b.category.type if b.category else "expense"
            },
            "amount": b.amount,
            "month": b.month,
            "year": b.year
        }
        for b in budgets
    ]

@app.post("/budgets")
def create_budget(
    data: BudgetCreate,
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Create or update a budget (upsert)"""
    user = get_current_user(request, authorization, token, db)

    # Always use upsert logic - check if budget already exists for this category/month/year
    existing = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.category_id == data.category_id,
        Budget.month == data.month,
        Budget.year == data.year
    ).first()

    if existing:
        # Update existing budget
        existing.amount = data.amount
        db.commit()
        return {"message": "Budget updated", "id": existing.id, "action": "updated"}

    # Create new budget
    budget = Budget(
        user_id=user.id,
        category_id=data.category_id,
        amount=data.amount,
        month=data.month,
        year=data.year
    )
    db.add(budget)
    db.commit()

    return {"message": "Budget created", "id": budget.id, "action": "created"}

@app.put("/budgets/{budget_id}")
def update_budget(
    budget_id: int,
    data: BudgetCreate,
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update a specific budget by ID"""
    user = get_current_user(request, authorization, token, db)

    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == user.id
    ).first()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    budget.category_id = data.category_id
    budget.amount = data.amount
    budget.month = data.month
    budget.year = data.year

    db.commit()
    return {"message": "Budget updated", "id": budget.id}

@app.delete("/budgets/{budget_id}")
def delete_budget(
    budget_id: int,
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Delete a budget"""
    user = get_current_user(request, authorization, token, db)
    
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    
    return {"message": "Budget deleted"}

@app.post("/budgets/copy-last-month")
def copy_last_month_budgets(
    year: int,
    month: int,
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Copy budgets from previous month to current month"""
    user = get_current_user(request, authorization, token, db)
    
    # Calculate previous month
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    
    # Get previous month's budgets
    prev_budgets = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.year == prev_year,
        Budget.month == prev_month
    ).all()
    
    if not prev_budgets:
        raise HTTPException(status_code=404, detail="No budgets found for last month")
    
    # Get current month's budgets to avoid duplicates
    current_budgets = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.year == year,
        Budget.month == month
    ).all()
    
    current_category_ids = {b.category_id for b in current_budgets}
    
    copied_count = 0
    for pb in prev_budgets:
        if pb.category_id not in current_category_ids:
            new_budget = Budget(
                user_id=user.id,
                category_id=pb.category_id,
                amount=pb.amount,
                month=month,
                year=year
            )
            db.add(new_budget)
            copied_count += 1
    
    if copied_count > 0:
        db.commit()
        return {"message": f"Successfully copied {copied_count} budgets from last month", "count": copied_count}
    else:
        return {"message": "All budgets from last month already exist for this month", "count": 0}

@app.get("/budgets/comparison")
def get_budget_comparison_endpoint(
    year: int,
    month: int,
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get budget vs actual comparison"""
    user = get_current_user(request, authorization, token, db)
    comparison = get_budget_comparison(db, user.id, year, month)
    return {"comparison": comparison}


# ============================================
# GOAL ROUTES
# ============================================

@app.get("/goals")
def get_goals_endpoint(
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all goals for current user"""
    user = get_current_user(request, authorization, token, db)
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    
    return [
        {
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "target_date": g.target_date.isoformat(),
            "category_ids": [cat.id for cat in g.categories],
            "category_names": [cat.name for cat in g.categories],
            "created_at": g.created_at.isoformat()
        }
        for g in goals
    ]

@app.post("/goals")
def create_goal_endpoint(
    data: GoalCreate, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Create a new savings goal"""
    user = get_current_user(request, authorization, token, db)
    
    # Get categories by IDs
    categories = []
    if data.category_ids:
        categories = db.query(Category).filter(Category.id.in_(data.category_ids)).all()

    goal = Goal(
        user_id=user.id,
        name=data.name,
        target_amount=data.target_amount,
        current_amount=data.current_amount,
        target_date=datetime.fromisoformat(data.target_date),
        categories=categories
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@app.put("/goals/{goal_id}")
def update_goal_endpoint(
    goal_id: int, 
    data: GoalUpdate, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update a savings goal"""
    user = get_current_user(request, authorization, token, db)
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    if data.name is not None:
        goal.name = data.name
    if data.target_amount is not None:
        goal.target_amount = data.target_amount
    if data.current_amount is not None:
        goal.current_amount = data.current_amount
    if data.target_date is not None:
        goal.target_date = datetime.fromisoformat(data.target_date)
    
    if data.category_ids is not None:
        # Update categories relationship
        categories = db.query(Category).filter(Category.id.in_(data.category_ids)).all()
        goal.categories = categories
        
    db.commit()
    db.refresh(goal)
    return goal

@app.delete("/goals/{goal_id}")
def delete_goal_endpoint(
    goal_id: int, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Delete a savings goal"""
    user = get_current_user(request, authorization, token, db)
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}


# ============================================
# User Profile
# ============================================
@app.patch("/profile")   # or @app.patch("/users/profile")
def update_profile(
    data: ProfileUpdate,
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    current_user = get_current_user(request, authorization, token, db)
    
    if data.username:
        # Check if username is taken
        existing = db.query(User).filter(User.username == data.username, User.id != current_user.id).first()
        if existing:
            raise HTTPException(400, "Username already taken")
        current_user.username = data.username
    
    if data.first_name is not None:
        current_user.first_name = data.first_name
    
    if data.last_name is not None:
        current_user.last_name = data.last_name
    
    if data.phone is not None:
        current_user.phone = data.phone
    
    if data.gender is not None:
        current_user.gender = data.gender
    
    if data.avatar_seed is not None:
        current_user.avatar_seed = data.avatar_seed
    
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "gender": current_user.gender,
        "avatar_seed": current_user.avatar_seed,
        "createdAt": current_user.created_at.isoformat() if current_user.created_at else None
    }

# ============================================
# ============================================
# OCR & RECEIPT PARSING ROUTES
# ============================================

class ReceiptUpload(BaseModel):
    """Schema for receipt upload with image"""
    pass

class ReceiptData(BaseModel):
    """Schema for receipt data confirmation"""
    merchant: str
    amount: float
    date: str  # Format: "2026-01-15"
    category_id: int
    description: str = ""

@app.post("/ocr/upload-receipt")
async def upload_receipt(
    request: Request,
    file: UploadFile = File(...),
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Upload a receipt image and extract data using OCR
    Returns extracted merchant, amount, date, and suggested category
    """
    check_rate_limit(request)
    
    # File validation
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
    ALLOWED_CONTENT_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
    
    # Validate file size
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Validate file extension
    filename = sanitize_filename(file.filename or "upload")
    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validate content type
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content type. Allowed types: {', '.join(ALLOWED_CONTENT_TYPES)}"
        )
    
    try:
        # Get current user
        user = get_current_user(request, authorization, token, db)
        
        # Save uploaded file temporarily
        temp_dir = tempfile.mkdtemp()
        temp_file_path = os.path.join(temp_dir, filename)
        
        try:
            # Write file content (we already read it for validation)
            with open(temp_file_path, "wb") as buffer:
                buffer.write(file_content)
            
            # Get available categories for categorization
            categories_db = db.query(Category).filter(
                (Category.user_id == None) | (Category.user_id == (user.id if user else None))
            ).all()
            
            categories_list = [
                {
                    "id": cat.id,
                    "name": cat.name,
                    "type": cat.type,
                    "keywords": cat.name.lower().split()
                }
                for cat in categories_db
            ]
            
            # Parse receipt
            result = await parse_receipt(temp_file_path, categories_list)
            
            if result["success"]:
                return {
                    "success": True,
                    "data": {
                        "merchant": result["merchant"],
                        "amount": result["amount"],
                        "date": result["date"],
                        "category_id": result["category_id"],
                        "confidence": result["confidence"],
                        "reasoning": result["reasoning"],
                        "extracted_text": result["extracted_text"][:500]  # Limit text preview
                    }
                }
            else:
                return {
                    "success": False,
                    "error": result["error"]
                }
        
        finally:
            # Clean up temporary files
            shutil.rmtree(temp_dir, ignore_errors=True)
    
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to process receipt: {str(e)}"
        }

@app.post("/ocr/confirm-receipt")
def confirm_receipt(
    request: Request,
    data: ReceiptData,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Confirm and save extracted receipt data as a transaction
    Called after user reviews and confirms OCR extraction
    """
    try:
        user = get_current_user(request, authorization, token, db)
        
        # Validate category exists and belongs to user or is default
        category = db.query(Category).filter(
            Category.id == data.category_id
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Create transaction
        signed_amount = -abs(data.amount) if category.type == "expense" else abs(data.amount)
        transaction = Transaction(
            user_id=user.id,
            category_id=data.category_id,
            amount=signed_amount,
            description=f"Receipt: {data.merchant}" if not data.description else data.description,
            date=datetime.fromisoformat(data.date)
        )
        
        db.add(transaction)
        
        # Update linked savings goals
        linked_goals = db.query(Goal).filter(
            Goal.user_id == user.id,
            Goal.categories.any(id=transaction.category_id)
        ).all()
        
        for goal in linked_goals:
            goal.current_amount += transaction.amount
                
        db.commit()
        db.refresh(transaction)
        
        return {
            "success": True,
            "message": "Transaction created from receipt",
            "transaction_id": transaction.id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error confirming receipt: {str(e)}")
        db.rollback()
        return {
            "success": False,
            "error": f"Failed to save transaction: {str(e)}"
        }

# TEST SSE ROUTE
# ============================================

@app.get("/test-sse")
async def test_sse():
    """Test SSE endpoint"""
    async def test_generator():
        yield "data: {\"type\": \"test\", \"message\": \"SSE working!\"}\n\n"
        await asyncio.sleep(1)
        yield "data: {\"type\": \"test\", \"message\": \"Test complete\"}\n\n"

    return StreamingResponse(
        test_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
        }
    )

# ============================================
# ROOT ROUTE
# ============================================

@app.get("/")
def root():
    return {
        "message": "Simple Finance Tracker API",
        "docs": "/docs",
        "version": "1.0 (Beginner Friendly)",
        "status": "online"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

def _parse_date(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    return datetime.fromisoformat(s).date()

def _month_range_end(d: date) -> date:
    if d.month == 12:
        return date(d.year, 12, 31)
    return (date(d.year, d.month + 1, 1) - timedelta(days=1))

def _default_period() -> tuple[date, date]:
    today = datetime.utcnow().date()
    start = date(today.year, today.month, 1)
    end = _month_range_end(start)
    return start, end

def _fetch_transactions(db: Session, user_id: int, start: date, end: date) -> List[Transaction]:
    q = db.query(Transaction).options(joinedload(Transaction.category)).filter(
        Transaction.user_id == user_id,
        func.date(Transaction.date) >= start,
        func.date(Transaction.date) <= end
    ).order_by(Transaction.date.desc())
    return q.all()

def _summarize(transactions: List[Transaction]) -> Dict[str, float | int | Dict]:
    income = sum(t.amount for t in transactions if t.amount > 0)
    expenses = abs(sum(t.amount for t in transactions if t.amount < 0))
    net = income - expenses
    savings_rate = (net / income * 100) if income > 0 else 0
    avg_amount = (sum(abs(t.amount) for t in transactions) / len(transactions)) if transactions else 0
    count = len(transactions)
    biggest_expense = min([t.amount for t in transactions if t.amount < 0], default=0)
    return {
        "income": round(income, 2),
        "expenses": round(expenses, 2),
        "net": round(net, 2),
        "savings_rate": round(savings_rate, 2),
        "avg_amount": round(avg_amount, 2),
        "count": count,
        "biggest_expense": round(abs(biggest_expense), 2)
    }

def _category_breakdown(transactions: List[Transaction]) -> List[Dict]:
    totals: Dict[str, float] = {}
    for t in transactions:
        if t.amount < 0:
            name = t.category.name if t.category else "Uncategorized"
            totals[name] = totals.get(name, 0) + abs(t.amount)
    total_exp = sum(totals.values())
    items = [{"name": k, "amount": v, "percent": (v / total_exp * 100) if total_exp > 0 else 0} for k, v in totals.items()]
    items.sort(key=lambda x: x["amount"], reverse=True)
    return items

def _top3_spending(categories: List[Dict]) -> List[Dict]:
    return categories[:3]

def _monthly_trend(db: Session, user_id: int, months: int = 6) -> Dict[str, List]:
    today = datetime.utcnow().date()
    labels = []
    incomes = []
    expenses = []
    cur = date(today.year, today.month, 1)
    for _ in range(months):
        start = cur
        end = _month_range_end(start)
        tx = _fetch_transactions(db, user_id, start, end)
        inc = sum(t.amount for t in tx if t.amount > 0)
        exp = abs(sum(t.amount for t in tx if t.amount < 0))
        labels.append(f"{start.strftime('%b %Y')}")
        incomes.append(inc)
        expenses.append(exp)
        if start.month == 1:
            cur = date(start.year - 1, 12, 1)
        else:
            cur = date(start.year, start.month - 1, 1)
    labels = list(reversed(labels))
    incomes = list(reversed(incomes))
    expenses = list(reversed(expenses))
    return {"labels": labels, "incomes": incomes, "expenses": expenses}

def _plot_monthly_trend(trend: Dict[str, List]) -> bytes:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from matplotlib.ticker import FuncFormatter

        # Professional Styling
        plt.style.use('bmh')
        fig, ax = plt.subplots(figsize=(8, 4), dpi=150)
        
        x = list(range(len(trend["labels"])))
        
        # Fill area for better visual
        ax.fill_between(x, trend["incomes"], color="#10b981", alpha=0.1)
        ax.fill_between(x, trend["expenses"], color="#ef4444", alpha=0.1)
        
        ax.plot(x, trend["incomes"], label="Income", color="#10b981", linewidth=2.5, marker='o', markersize=4)
        ax.plot(x, trend["expenses"], label="Expenses", color="#ef4444", linewidth=2.5, marker='s', markersize=4)
        
        ax.set_xticks(x)
        ax.set_xticklabels(trend["labels"], rotation=30, ha="right", fontsize=9)
        
        # Format Y axis as currency
        def currency_formatter(x, pos):
            return f'EGP {x:,.0f}'
        ax.yaxis.set_major_formatter(FuncFormatter(currency_formatter))
        
        ax.legend(frameon=True, facecolor='white', framealpha=0.8, loc='upper left', fontsize=9)
        ax.set_title("Financial Trends", fontsize=12, fontweight='bold', pad=15)
        
        # Remove top/right spines
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        
        buf = io.BytesIO()
        plt.tight_layout()
        fig.savefig(buf, format="png", dpi=150, transparent=True)
        plt.close(fig)
        return buf.getvalue()
    except Exception as e:
        print(f"Warning: Could not generate monthly trend plot: {e}")
        return b""

def _plot_category_pie(categories: List[Dict]) -> bytes:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        
        # Filter only expenses for pie chart as it makes more sense
        expense_cats = [c for c in categories if c["amount"] > 0][:7]
        
        labels = [c["name"] for c in expense_cats]
        sizes = [c["amount"] for c in expense_cats]
        
        if not sizes:
            sizes = [1]
            labels = ["No data"]
        
        fig, ax = plt.subplots(figsize=(6, 5), dpi=150)
        
        # Modern color palette (Amber/Slate based)
        colors = ["#f59e0b", "#fbbf24", "#fcd34d", "#fb923c", "#f97316", "#10b981", "#34d399"]
        
        wedges, texts, autotexts = ax.pie(
            sizes, 
            labels=labels, 
            autopct="%1.0f%%", 
            colors=colors,
            startangle=140,
            pctdistance=0.85,
            explode=[0.05] * len(sizes), # Explode all slightly
            wedgeprops={'width': 0.5, 'edgecolor': 'white', 'linewidth': 1} # Donut style
        )
        
        plt.setp(autotexts, size=8, weight="bold", color="white")
        plt.setp(texts, size=9)
        
        ax.set_title("Spending Breakdown", fontsize=12, fontweight='bold', pad=10)
        ax.axis("equal")
        
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=150, transparent=True)
        plt.close(fig)
        return buf.getvalue()
    except Exception as e:
        print(f"Warning: Could not generate category pie plot: {e}")
        return b""

def _build_pdf(user: User, period_label: str, summary: Dict, trend_png: bytes, pie_png: bytes, transactions: List[Transaction], budget_status: List[Dict] | None, rec_text: str | None, rec_model: str | None, goals: List[Dict] | None = None) -> bytes:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, ListFlowable, ListItem, HRFlowable, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        from reportlab.lib.units import inch
    except ImportError:
        print("Error: reportlab is not installed. PDF generation is disabled.")
        raise HTTPException(
            status_code=424, 
            detail="PDF generation engine (reportlab) is not installed on the server. Please contact the administrator or try exporting as CSV."
        )
    
    buf = io.BytesIO()
    
    def my_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.setStrokeColor(colors.HexColor("#e5e7eb"))
        canvas.line(0.5*inch, 0.5*inch, 7.75*inch, 0.5*inch)
        page_num = canvas.getPageNumber()
        text = f"Page {page_num} | Moataz Finance Tracker | Confidential"
        canvas.drawCentredString(4.125*inch, 0.3*inch, text)
        canvas.restoreState()

    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=60)
    styles = getSampleStyleSheet()
    
    # Custom Colors
    accent = colors.HexColor("#f59e0b")
    income_green = colors.HexColor("#10b981")
    expense_red = colors.HexColor("#ef4444")
    dark_slate = colors.HexColor("#0f172a")
    slate_500 = colors.HexColor("#64748b")
    bg_light = colors.HexColor("#f8fafc")

    # Custom Styles
    styles.add(ParagraphStyle(
        name="MainTitle", 
        fontName="Helvetica-Bold", 
        fontSize=28, 
        textColor=dark_slate, 
        spaceAfter=0,
        alignment=0,
        leading=32
    ))
    styles.add(ParagraphStyle(
        name="StatLabel", 
        fontName="Helvetica-Bold", 
        fontSize=8.5, 
        textColor=slate_500, 
        textTransform='uppercase',
        alignment=1,
        leading=12
    ))
    styles.add(ParagraphStyle(
        name="StatValue", 
        fontName="Helvetica-Bold", 
        fontSize=18, 
        textColor=dark_slate, 
        alignment=1,
        leading=22
    ))
    styles.add(ParagraphStyle(
        name="SectionHeader", 
        fontName="Helvetica-Bold", 
        fontSize=15, 
        textColor=accent,
        spaceBefore=25,
        spaceAfter=15,
        leading=20
    ))
    styles.add(ParagraphStyle(
        name="Subtitle",
        fontName="Helvetica",
        fontSize=10.5,
        textColor=slate_500,
        spaceAfter=2,
        leading=14
    ))
    styles.add(ParagraphStyle(
        name="RightSubtitle",
        parent=styles["Subtitle"],
        alignment=2
    ))
    styles.add(ParagraphStyle(
        name="NormalFancy",
        fontName="Helvetica",
        fontSize=11,
        textColor=dark_slate,
        leading=16
    ))
    styles.add(ParagraphStyle(
        name="TableHeader",
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=colors.white,
        alignment=0
    ))
    styles.add(ParagraphStyle(
        name="TableCell",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=dark_slate,
        leading=12
    ))

    story = []
    
    # 1. Header Section
    from datetime import datetime
    gen_date = datetime.now().strftime("%d %b %Y")
    
    header_data = [
        [
            Paragraph("AI Finance Advisor", styles["MainTitle"]), 
            Paragraph(f"<b>Financial Intelligence Report</b>", styles["RightSubtitle"])
        ],
        [
            Paragraph(f"Client: {user.first_name or ''} {user.last_name or ''}", styles["Subtitle"]), 
            Paragraph(f"Period: {period_label}", styles["RightSubtitle"])
        ],
        [
            Paragraph(f"Email: {user.email}", styles["Subtitle"]),
            Paragraph(f"Generated: {gen_date}", styles["RightSubtitle"])
        ]
    ]
    header_table = Table(header_data, colWidths=[3.75*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", color=accent, thickness=2, spaceBefore=10, spaceAfter=15))

    # Period Description
    period_desc = f"This report reflects the financial activity for <b>{period_label}</b>."
    story.append(Paragraph(period_desc, styles["NormalFancy"]))
    story.append(Spacer(1, 15))

    # 2. Executive Summary (Cards View)
    summary_cards_data = [
        [
            Paragraph("Total Income", styles["StatLabel"]),
            Paragraph("Total Expenses", styles["StatLabel"]),
            Paragraph("Net Savings", styles["StatLabel"]),
            Paragraph("Savings Rate", styles["StatLabel"]),
        ],
        [
            Paragraph(f"EGP {summary['income']:,.0f}", ParagraphStyle('V1', parent=styles['StatValue'], textColor=income_green)),
            Paragraph(f"EGP {summary['expenses']:,.0f}", ParagraphStyle('V2', parent=styles['StatValue'], textColor=expense_red)),
            Paragraph(f"EGP {summary['net']:,.0f}", styles['StatValue']),
            Paragraph(f"{summary['savings_rate']:.1f}%", styles['StatValue']),
        ]
    ]
    
    summary_table = Table(summary_cards_data, colWidths=[1.8*inch]*4)
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 15),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 24))

    # 3. Visual Analysis
    if trend_png or pie_png:
        story.append(Paragraph("Market Trends & Performance", styles["SectionHeader"]))
        
        if trend_png:
            try:
                trend_img = Image(io.BytesIO(trend_png), width=6.5*inch, height=3*inch)
                story.append(trend_img)
                story.append(Spacer(1, 20))
            except Exception as e:
                print(f"Error adding trend image to PDF: {e}")
        
        if pie_png:
            try:
                pie_img = Image(io.BytesIO(pie_png), width=5*inch, height=4*inch)
                story.append(pie_img)
                story.append(Spacer(1, 24))
            except Exception as e:
                print(f"Error adding pie image to PDF: {e}")
    else:
        story.append(Paragraph("Visual Analysis (Unavailable)", styles["SectionHeader"]))
        story.append(Paragraph("Graphs could not be generated because the plotting engine is missing on the server.", styles["NormalFancy"]))
        story.append(Spacer(1, 24))

    # 4. Savings Goals
    if goals:
        story.append(Paragraph("Financial Goals Progress", styles["SectionHeader"]))
        goal_rows = [["Goal Name", "Target", "Current", "Progress", "Target Date"]]
        for g in goals:
            progress = (g['current_amount'] / g['target_amount'] * 100) if g['target_amount'] > 0 else 0
            goal_rows.append([
                g['name'],
                f"EGP {g['target_amount']:,.0f}",
                f"EGP {g['current_amount']:,.0f}",
                f"{progress:.1f}%",
                g['target_date'].strftime("%d %b %Y") if hasattr(g['target_date'], 'strftime') else str(g['target_date'])
            ])
        
        goal_tbl = Table(goal_rows, repeatRows=1, colWidths=[2.25*inch, 1.25*inch, 1.25*inch, 1*inch, 1.5*inch])
        goal_style = TableStyle([
            ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#3b82f6")), # Blue for goals
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,0), 10.5), # Slightly larger header
            ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
            ("FONTSIZE", (0,1), (-1,-1), 9.5),
            ("ALIGN", (1,1), (3,-1), "RIGHT"),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("TOPPADDING", (0,0), (-1,-1), 8),
        ])
        goal_tbl.setStyle(goal_style)
        story.append(goal_tbl)
        story.append(Spacer(1, 24))

    # 5. AI Insights Section
    if rec_text:
        story.append(PageBreak())
        story.append(Paragraph("AI Financial Recommendations", styles["SectionHeader"]))
        
        rec_html = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", rec_text)
        # Split into points and format nicely
        lines = [l.strip() for l in rec_html.split("\n") if l.strip()]
        
        # Recommendation Card
        rec_story = []
        for line in lines:
            # Check for bullet points or numbered lists
            clean_line = re.sub(r"^[*-]\s+", "", line) # Remove bullet
            clean_line = re.sub(r"^\d+\.\s+", "", clean_line) # Remove numbering
            
            if line.startswith(('-', '*', '1.', '2.', '3.', '4.', '5.')):
                rec_story.append(ListItem(Paragraph(clean_line, styles["NormalFancy"])))
            else:
                rec_story.append(Paragraph(line, styles["NormalFancy"]))
                rec_story.append(Spacer(1, 6))
        
        # Wrap rec_story in ListFlowable if it contains ListItems
        final_rec_content = []
        current_list_items = []
        
        for item in rec_story:
            if isinstance(item, ListItem):
                current_list_items.append(item)
            else:
                if current_list_items:
                    final_rec_content.append(ListFlowable(current_list_items, bulletType='bullet'))
                    current_list_items = []
                final_rec_content.append(item)
        
        if current_list_items:
            final_rec_content.append(ListFlowable(current_list_items, bulletType='bullet'))

        rec_box_data = [[final_rec_content]]
        rec_table = Table(rec_box_data, colWidths=[7*inch])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fffbeb")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#fde68a")),
            ('TOPPADDING', (0,0), (-1,-1), 15),
            ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ('LEFTPADDING', (0,0), (-1,-1), 15),
            ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ]))
        story.append(rec_table)
        if rec_model:
             # Clean model name for display (remove provider prefix)
            display_model = rec_model.split('/')[-1].split(':')[0].replace('-', ' ').title()
            story.append(Paragraph(f"<i>Analysis engine: {display_model}</i>", styles["Subtitle"]))
            story.append(Spacer(1, 24))


    # 5. Budget Performance
    if budget_status:
        story.append(Paragraph("Budget Compliance", styles["SectionHeader"]))
        bs_rows = [["Category", "Budgeted", "Spent", "Used %", "Status"]]
        for b in budget_status:
            used_pct = (b['actual']/b['budget']*100 if ('actual' in b and b['budget']>0) else b.get('percentage', 0))
            status = "Over Budget" if used_pct > 100 else ("On Track" if used_pct > 80 else "Good")
            
            bs_rows.append([
                b["category"],
                f"EGP {b.get('budget', 0):,.2f}",
                f"EGP {b.get('actual', 0):,.2f}",
                f"{used_pct:.1f}%",
                status
            ])
        
        bs_tbl = Table(bs_rows, repeatRows=1, colWidths=[2*inch, 1.25*inch, 1.25*inch, 1*inch, 1.5*inch])
        bs_style = TableStyle([
            ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
            ("BACKGROUND", (0,0), (-1,0), accent),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,0), 10.5),
            ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
            ("FONTSIZE", (0,1), (-1,-1), 9.5),
            ("ALIGN", (1,1), (3,-1), "RIGHT"),
            ("ALIGN", (4,1), (4,-1), "CENTER"),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("TOPPADDING", (0,0), (-1,-1), 6),
        ])
        
        for i in range(1, len(bs_rows)):
            pct_val = float(bs_rows[i][3].replace('%', ''))
            if pct_val > 100:
                bs_style.add("TEXTCOLOR", (4,i), (4,i), expense_red)
                bs_style.add("BACKGROUND", (0,i), (-1,i), colors.HexColor("#fee2e2"))
            elif pct_val > 80:
                bs_style.add("TEXTCOLOR", (4,i), (4,i), accent)
                bs_style.add("BACKGROUND", (0,i), (-1,i), colors.HexColor("#fff7ed"))
            else:
                bs_style.add("TEXTCOLOR", (4,i), (4,i), income_green)
        
        bs_tbl.setStyle(bs_style)
        story.append(bs_tbl)
        story.append(Spacer(1, 24))

    # 6. Detailed Ledger
    story.append(Paragraph("Transaction Detail Ledger", styles["SectionHeader"]))
    rows = [["Date", "Description", "Category", "Amount", "Type"]]
    for t in transactions:
        cat_name = t.category.name if t.category else "Uncategorized"
        typ = "Income" if t.amount > 0 else "Expense"
        rows.append([
            t.date.strftime("%d %b"),
            (t.description or "-")[:40],
            cat_name,
            f"EGP {abs(t.amount):,.2f}",
            typ
        ])
        
    detail = Table(rows, repeatRows=1, colWidths=[1*inch, 2.5*inch, 1.5*inch, 1*inch, 1*inch])
    detail_style = TableStyle([
        ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
        ("BACKGROUND", (0,0), (-1,0), dark_slate),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,0), 9.5),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE", (0,1), (-1,-1), 8.5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, bg_light]),
        ("ALIGN", (3,1), (3,-1), "RIGHT"),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("TOPPADDING", (0,0), (-1,-1), 4),
    ])
    
    for i in range(1, len(rows)):
        if rows[i][4] == "Income":
            detail_style.add("TEXTCOLOR", (3,i), (4,i), income_green)
        else:
            detail_style.add("TEXTCOLOR", (3,i), (4,i), expense_red)
            
    detail.setStyle(detail_style)
    story.append(detail)
    
    # Subtotal line
    subtotal = sum(t.amount for t in transactions)
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>Net Period Flow:</b> <font color='{income_green if subtotal > 0 else expense_red}'>EGP {subtotal:,.2f}</font>", styles["NormalFancy"]))

    # Build PDF with custom footer
    doc.build(story, onFirstPage=my_footer, onLaterPages=my_footer)
    return buf.getvalue()

def _build_csv(transactions: List[Transaction]) -> bytes:
    import csv
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["date", "merchant", "category", "description", "amount", "type"])
    
    for t in transactions:
        cat_name = t.category.name if t.category else "Uncategorized"
        typ = "income" if t.amount > 0 else "expense"
        desc = t.description or ""
        merch = ""
        if desc.lower().startswith("receipt:"):
            parts = desc.split(":", 1)
            if len(parts) > 1:
                merch = parts[1].strip()
        
        writer.writerow([
            t.date.strftime("%Y-%m-%d") if t.date else "",
            merch,
            cat_name,
            desc,
            t.amount,
            typ
        ])
    
    return output.getvalue().encode("utf-8")

@app.post("/reports/generate")
def generate_report(
    data: ReportRequest, 
    request: Request,
    authorization: HTTPAuthorizationCredentials = Depends(security),
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user = get_current_user(request, authorization, token, db)
    start, end = _default_period()
    if data.start_date:
        start = _parse_date(data.start_date) or start
    if data.end_date:
        end = _parse_date(data.end_date) or end
    if end < start:
        raise HTTPException(status_code=400, detail="Invalid date range")
    tx = _fetch_transactions(db, user.id, start, end)
    
    if start.year == end.year and start.month == end.month:
        period_label = start.strftime('%B %Y')
    else:
        period_label = f"{start.strftime('%d %b %Y')} to {end.strftime('%d %b %Y')}"

    if not tx:
        if data.format == "csv":
            empty = "date,merchant,category,description,amount,type\n"
            return StreamingResponse(io.BytesIO(empty.encode("utf-8")), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="report_{period_label}.csv"'})
        raise HTTPException(status_code=404, detail="No transactions for period")
    summary = _summarize(tx)
    cats = _category_breakdown(tx)
    trend = _monthly_trend(db, user.id, 6)
    trend_png = _plot_monthly_trend(trend)
    pie_png = _plot_category_pie(cats)
    bs = None
    if start.year == end.year and start.month == end.month:
        bs = get_budget_comparison(db, user.id, start.year, start.month)
    
    # Fetch goals for report
    user_goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    goals_data = []
    for g in user_goals:
        goals_data.append({
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "target_date": g.target_date
        })

    rec_text = None
    rec_model = None
    try:
        OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
        if not OPENROUTER_API_KEY:
            rec_text = "Focus on reducing discretionary expenses, maintain consistent income streams, and set clear limits on categories trending over budget. Prioritize top two actions for the coming period."
            rec_model = "mock-model-for-testing"
        else:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8001",
                "X-Title": "Finance Tracker AI",
            }
            MODELS = FREE_MODELS.copy()
            random.shuffle(MODELS)
            
            # Build context for report AI
            spending_text = "\n".join([f"- {c['name']}: ${c['amount']:.2f} ({c['percent']:.1f}%)" for c in cats[:5]])
            budget_text = ""
            if bs:
                budget_text = "\n".join([f"- {b['category']}: ${b['actual']:.2f} / ${b['budget']:.2f} ({'⚠️ OVER' if b['status'] == 'Over' else '✅ OK'})" for b in bs])
            
            prompt_text = f"""You are a professional financial advisor. Analyze this data for {start.strftime('%B %Y')}:

📊 SUMMARY:
- Income: ${summary['income']:.2f}
- Expenses: ${summary['expenses']:.2f}
- Savings: ${summary['net']:.2f}
- Savings Rate: {summary['savings_rate']:.1f}%

💰 TOP SPENDING:
{spending_text}

🎯 BUDGET PERFORMANCE:
{budget_text if budget_text else "No budgets set for this period."}

PROVIDE A CONCISE ANALYSIS (150-250 words max):
1. **Financial Health** (1-2 sentences)
2. **Budget Performance** (2-4 sentences) - MUST list categories with budgets. Explicitly state which are OVER budget and which are UNDER/ON TRACK with specific numbers.
3. **Top 2 Actions** (2 bullet points) - Specific, actionable steps.

Be direct, encouraging, and specific with numbers. Keep it SHORT but DETAILED regarding budgets."""

            for model_id in MODELS:
                payload = {
                    "model": model_id,
                    "messages": [
                        {"role": "system", "content": "You are a concise financial coach. Output short, actionable sections."},
                        {"role": "user", "content": prompt_text}
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                }
                with httpx.Client(verify=False, timeout=20.0) as client:
                    r = client.post(url, headers=headers, json=payload)
                    if r.status_code == 200:
                        result = r.json()
                        rec_text = result["choices"][0]["message"]["content"]
                        rec_model = model_id
                        break
    except Exception:
        if not rec_text:
            rec_text = "Focus on reducing discretionary expenses, maintain consistent income streams, and set clear limits on categories trending over budget. Prioritize top two actions for the coming period."
        if not rec_model:
            rec_model = "mock-model-for-testing"
    
    if data.format == "csv":
        csv_bytes = _build_csv(tx)
        return StreamingResponse(io.BytesIO(csv_bytes), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="report_{period_label}.csv"'})
    pdf_bytes = _build_pdf(user, period_label, summary, trend_png, pie_png, tx, bs, rec_text, rec_model, goals_data)
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="report_{period_label}.pdf"'})
