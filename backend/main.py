"""
Main FastAPI Application - ALL ROUTES IN ONE FILE!
This is the entire backend - easy to understand everything in one place
"""
import sys
import os

# Fix imports - add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import httpx
import random
import json
import asyncio

# Import local modules
from database import get_db, init_database
from models import User, Transaction, Category, Budget
from dotenv import load_dotenv
from ocr_utils import parse_receipt
from fastapi import File, UploadFile
import tempfile
import shutil

load_dotenv()

FREE_MODELS = [
    # "openai/gpt-4o-mini",                      # OpenAI    - ChatGPT (Paid)
    # "openai/chatgpt-4o-latest",                # OpenAI    - ChatGPT (paid)
    "openai/gpt-oss-120b:free",
    "google/gemini-2.0-flash-exp:free",          # Google    - Gemini
    "google/gemma-3-27b-it:free",
    "deepseek/deepseek-r1-0528:free",            # DeepSeek  - DeepSeek
    "tngtech/deepseek-r1t2-chimera:free",
    "meta-llama/llama-3.3-70b-instruct:free",    # Meta      - Llama
    "mistralai/mistral-7b-instruct:free",        # MistralAI - Mistral
    "mistralai/devstral-2512:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",       # Nvidia    - Nemotron
    "qwen/qwen-2.5-vl-7b-instruct:free",
    "qwen/qwen3-coder:free",                     # Alibaba   - Qwen 3 Coder
    "xiaomi/mimo-v2-flash:free",
    "z-ai/glm-4.5-air:free",                     # Z-AI      - GLM 4.5 Air
    "tngtech/tng-r1t-chimera:free"
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
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TransactionCreate(BaseModel):
    category_id: int
    amount: float
    description: str
    date: str  # Format: "2026-01-15"

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

class CategoryCreate(BaseModel):
    name: str
    type: str  # "income" or "expense"
    icon: str  # emoji like 🍔


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


def get_current_user(token: str, db: Session = Depends(get_db)) -> User:
    try:
        # 1. Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id_str = payload.get("sub")
        
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="Token missing user ID")
            
        user_id = int(user_id_str)
        
        # 2. Find the user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User no longer exists")
            
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please login again.")
    except Exception as e:
        print(f"Auth Error: {e}") # This will show in your terminal
        raise HTTPException(status_code=401, detail="Invalid token")


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
def get_me(token: str, db: Session = Depends(get_db)):
    """
    Get current user info
    """
    user = get_current_user(token, db)
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "createdAt": user.created_at.isoformat() if user.created_at else None
    }


# ============================================
# TRANSACTION ROUTES
# ============================================

@app.get("/transactions")
def get_transactions(token: str, db: Session = Depends(get_db)):
    """
    Get all transactions for current user
    """
    user = get_current_user(token, db)
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user.id
    ).order_by(Transaction.date.desc()).all()
    
    # Format response
    result = []
    for t in transactions:
        result.append({
            "id": t.id,
            "amount": t.amount,
            "description": t.description,
            "date": t.date.isoformat(),
            "category_name": t.category.name,
            "category_icon": t.category.icon
        })
    
    return result


@app.post("/transactions")
def create_transaction(
    data: TransactionCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Add a new transaction
    """
    user = get_current_user(token, db)
    
    # Create transaction
    transaction = Transaction(
        user_id=user.id,
        category_id=data.category_id,
        amount=data.amount,
        description=data.description,
        date=datetime.fromisoformat(data.date)
    )
    db.add(transaction)
    db.commit()
    
    return {"message": "Transaction created", "id": transaction.id}


@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Delete a transaction
    """
    user = get_current_user(token, db)
    
    # Find transaction
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    
    return {"message": "Transaction deleted"}


@app.get("/categories")
def get_categories(token: str, db: Session = Depends(get_db)):
    """
    Get all available categories (default + user's custom ones)
    """
    user = get_current_user(token, db)
    
    # Get default categories (user_id is NULL)
    default_categories = db.query(Category).filter(Category.user_id == None).all()
    
    # Get user's custom categories
    custom_categories = db.query(Category).filter(Category.user_id == user.id).all()
    
    # Combine both
    all_categories = default_categories + custom_categories
    
    return [
        {
            "id": c.id,
            "name": c.name,
            "type": c.type,
            "icon": c.icon,
            "is_custom": c.user_id is not None
        }
        for c in all_categories
    ]


@app.post("/categories")
def create_category(
    data: CategoryCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Create a custom category for the user
    """
    user = get_current_user(token, db)
    
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
    category_id: int,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Delete a custom category (only the user's own categories)
    """
    user = get_current_user(token, db)
    
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
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    
    monthly_tx = [t for t in transactions if t.date.year == year and t.date.month == month]
    
    total_income = sum(t.amount for t in monthly_tx if t.amount > 0)
    total_expenses = abs(sum(t.amount for t in monthly_tx if t.amount < 0))
    
    categories = {}
    for t in monthly_tx:
        if t.amount < 0:
            name = t.category.name if t.category else "Uncategorized"
            categories[name] = categories.get(name, 0) + abs(t.amount)
            
    return {
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "category_breakdown": [{"name": k, "amount": round(v, 2)} for k, v in categories.items()]
    }

# 2. Update the API Route to use that logic
@app.get("/analytics/monthly")
def get_monthly_analytics(year: int, month: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    return get_monthly_stats_logic(db, user.id, year, month)

# 3. Update the Budget Comparison to use that logic (No more token error!)
def get_budget_comparison(db: Session, user_id: int, year: int, month: int):
    actuals = get_monthly_stats_logic(db, user_id, year, month)
    
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.year == year,
        Budget.month == month
    ).all()
    
    budget_map = {b.category.name: b.amount for b in budgets}
    
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

def build_rich_financial_context(db: Session, user_id: int, year: int, month: int):
    """
    Build comprehensive financial context for AI analysis
    """
    # Get current month transactions
    current_month_tx = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        func.extract('year', Transaction.date) == year,
        func.extract('month', Transaction.date) == month
    ).all()
    
    # Get previous month transactions for comparison
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    
    prev_month_tx = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        func.extract('year', Transaction.date) == prev_year,
        func.extract('month', Transaction.date) == prev_month
    ).all()
    
    # Calculate current month stats
    current_income = sum(t.amount for t in current_month_tx if t.amount > 0)
    current_expenses = abs(sum(t.amount for t in current_month_tx if t.amount < 0))
    current_savings = current_income - current_expenses
    current_savings_rate = (current_savings / current_income * 100) if current_income > 0 else 0
    
    # Calculate previous month stats
    prev_income = sum(t.amount for t in prev_month_tx if t.amount > 0)
    prev_expenses = abs(sum(t.amount for t in prev_month_tx if t.amount < 0))
    prev_savings = prev_income - prev_expenses
    
    # Calculate trends
    income_change = ((current_income - prev_income) / prev_income * 100) if prev_income > 0 else 0
    expense_change = ((current_expenses - prev_expenses) / prev_expenses * 100) if prev_expenses > 0 else 0
    savings_change = ((current_savings - prev_savings) / abs(prev_savings) * 100) if prev_savings != 0 else 0
    
    # Category breakdown with trends
    current_categories = {}
    prev_categories = {}
    
    for t in current_month_tx:
        if t.amount < 0:
            cat_name = t.category.name if t.category else "Uncategorized"
            current_categories[cat_name] = current_categories.get(cat_name, 0) + abs(t.amount)
    
    for t in prev_month_tx:
        if t.amount < 0:
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
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.year == year,
        Budget.month == month
    ).all()
    
    budget_status = []
    for budget in budgets:
        cat_name = budget.category.name
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
        [t for t in current_month_tx if t.amount < 0],
        key=lambda x: abs(x.amount),
        reverse=True
    )[:3]
    
    # Count transactions per category
    transaction_frequency = {}
    for t in current_month_tx:
        if t.amount < 0:
            cat_name = t.category.name if t.category else "Uncategorized"
            transaction_frequency[cat_name] = transaction_frequency.get(cat_name, 0) + 1
    
    return {
        "current_month": {
            "income": round(current_income, 2),
            "expenses": round(current_expenses, 2),
            "savings": round(current_savings, 2),
            "savings_rate": round(current_savings_rate, 1),
            "transaction_count": len(current_month_tx)
        },
        "previous_month": {
            "income": round(prev_income, 2),
            "expenses": round(prev_expenses, 2),
            "savings": round(prev_savings, 2)
        },
        "trends": {
            "income_change": round(income_change, 1),
            "expense_change": round(expense_change, 1),
            "savings_change": round(savings_change, 1)
        },
        "category_breakdown": sorted(
            [{"name": k, "amount": round(v, 2), "percent": round(v/current_expenses*100, 1) if current_expenses > 0 else 0} 
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


# ============================================
# AI ROUTES (OpenAI Integration with Real-time Updates)
# ============================================

async def create_ai_progress_generator(db: Session, user_id: int, year: int, month: int):
    """Async generator that yields SSE events for AI model progress"""

    # Get rich context
    context = build_rich_financial_context(db, user_id, year, month)

    if context["current_month"]["transaction_count"] == 0:
        yield f"data: {json.dumps({'type': 'error', 'message': 'No transactions found for this month'})}\n\n"
        return

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

PROVIDE A CONCISE ANALYSIS (150-200 words max):
1. **Financial Health** (1-2 sentences) - Savings rate assessment
2. **Key Win** (1 sentence) - One main achievement
3. **Main Concern** (1-2 sentences) - Biggest issue with specific numbers
4. **Top 2 Actions** (2 bullet points) - Specific, actionable steps

Be direct, encouraging, and specific with numbers. Use 2-3 emojis maximum. Keep it SHORT."""

    # TEMPORARY: Mock response for testing
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    if not OPENROUTER_API_KEY:
        print("⚠️  No OPENROUTER_API_KEY found - using mock response for testing")
        yield f"data: {json.dumps({'type': 'trying_model', 'model': 'mock-model-for-testing'})}\n\n"
        await asyncio.sleep(1)
        yield f"data: {json.dumps({'type': 'success', 'model': 'mock-model-for-testing', 'summary': '**Financial Health Assessment**\n\nYour finances look solid with consistent income and reasonable spending patterns.\n\n**Key Achievement**\nYou have maintained good savings habits this month.\n\n**Area for Improvement**\nConsider reducing dining out expenses which are 15% higher than last month.\n\n**Recommended Actions**\n• Set a budget for entertainment expenses\n• Review your subscriptions for unused services', 'context': context})}\n\n"
        return

    # AI Model Loop
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
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
            "max_tokens": 400,
            "temperature": 0.7
        }

        async with httpx.AsyncClient(verify=False) as client:
            try:
                # Shorter timeout per model attempt (15 seconds)
                response = await client.post(url, headers=headers, json=payload, timeout=15.0)

                if response.status_code == 200:
                    result = response.json()
                    summary = result['choices'][0]['message']['content']

                    # Send success event
                    yield f"data: {json.dumps({'type': 'success', 'model': model_id, 'summary': summary, 'context': context})}\n\n"
                    return

                elif response.status_code == 429:
                    # Send failed event (rate limited)
                    yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'rate_limited'})}\n\n"
                    await asyncio.sleep(0.5)  # Brief pause before next model
                    continue

            except httpx.TimeoutException:
                # Send timeout event and continue to next model
                yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'timeout'})}\n\n"
                continue

            except Exception as e:
                # Send failed event (error)
                yield f"data: {json.dumps({'type': 'model_failed', 'model': model_id, 'reason': 'error', 'error': str(e)})}\n\n"
                continue

    # All models failed
    yield f"data: {json.dumps({'type': 'error', 'message': 'All AI models are currently busy. Please try again in a minute.'})}\n\n"

@app.get("/ai/progress")
async def ai_progress_stream(year: int, month: int, token: str, db: Session = Depends(get_db)):
    """Server-Sent Events endpoint for real-time AI model progress"""
    print(f"🎯 SSE REQUEST RECEIVED: year={year}, month={month}, token_length={len(token) if token else 0}")

    if not token:
        print("❌ SSE: No token provided")
        return {"error": "No token provided"}

    try:
        user = get_current_user(token, db)
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

@app.post("/ai/summary")
async def generate_ai_summary(year: int, month: int, token: str, db: Session = Depends(get_db)):
    user = get_current_user(token, db)
    
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

PROVIDE A CONCISE ANALYSIS (150-200 words max):
1. **Financial Health** (1-2 sentences) - Savings rate assessment
2. **Key Win** (1 sentence) - One main achievement
3. **Main Concern** (1-2 sentences) - Biggest issue with specific numbers
4. **Top 2 Actions** (2 bullet points) - Specific, actionable steps

Be direct, encouraging, and specific with numbers. Use 2-3 emojis maximum. Keep it SHORT."""

    # TEMPORARY: Mock response for testing
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    if not OPENROUTER_API_KEY:
        print("⚠️  No OPENROUTER_API_KEY found - returning mock response for testing")
        return {
            "summary": "**Financial Health Assessment**\n\nYour finances look solid with consistent income and reasonable spending patterns.\n\n**Key Achievement**\nYou've maintained good savings habits this month.\n\n**Area for Improvement**\nConsider reducing dining out expenses which are 15% higher than last month.\n\n**Recommended Actions**\n• Set a budget for entertainment expenses\n• Review your subscriptions for unused services",
            "context": context,
            "model_used": "mock-model-for-testing"
        }

    # AI Model Loop
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Finance Tracker AI",
    }
    
    MODELS = FREE_MODELS.copy()
    random.shuffle(MODELS)

    for model_id in MODELS:
        print(f"DEBUG: Randomly selected model: {model_id}")
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
            "max_tokens": 400,  # Shorter response
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(verify=False) as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=30.0)
                
                if response.status_code == 200:
                    result = response.json()
                    summary = result['choices'][0]['message']['content']
                    
                    return {
                        "summary": summary,
                        "context": context,  # Return context for frontend to display charts
                        "model_used": model_id
                    }
                
                elif response.status_code == 429:
                    print(f"Model {model_id} busy, trying next...")
                    continue
                    
            except Exception as e:
                print(f"Error with {model_id}: {e}")
                continue
    
    raise HTTPException(
        status_code=503,
        detail="All AI models are currently busy. Please try again in a minute."
    )


# ============================================
# BUDGET ROUTES (Add these to main.py)
# ============================================

class BudgetCreate(BaseModel):
    category_id: int
    amount: float
    month: int  # 1-12
    year: int

@app.get("/budgets")
def get_budgets(token: str, year: int = None, month: int = None, db: Session = Depends(get_db)):
    """Get budgets for current user, optionally filtered by month/year"""
    user = get_current_user(token, db)

    query = db.query(Budget).filter(Budget.user_id == user.id)

    if year is not None and month is not None:
        query = query.filter(Budget.year == year, Budget.month == month)

    budgets = query.all()

    return [
        {
            "id": b.id,
            "category_id": b.category_id,
            "category": {
                "id": b.category.id,
                "name": b.category.name,
                "icon": b.category.icon,
                "type": b.category.type
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
    token: str,
    db: Session = Depends(get_db)
):
    """Create or update a budget (upsert)"""
    user = get_current_user(token, db)

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
    token: str,
    db: Session = Depends(get_db)
):
    """Update a specific budget by ID"""
    user = get_current_user(token, db)

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
    token: str,
    db: Session = Depends(get_db)
):
    """Delete a budget"""
    user = get_current_user(token, db)
    
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    
    return {"message": "Budget deleted"}

@app.get("/budgets/comparison")
def get_budget_comparison_endpoint(
    year: int,
    month: int,
    token: str,
    db: Session = Depends(get_db)
):
    """Get budget vs actual comparison"""
    user = get_current_user(token, db)
    comparison = get_budget_comparison(db, user.id, year, month)
    return {"comparison": comparison}


# ============================================
# User Profile
# ============================================
@app.patch("/profile")   # or @app.patch("/users/profile")
def update_profile(
    data: ProfileUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    current_user = get_current_user(token, db)
    
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
    
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
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
    file: UploadFile = File(...),
    token: str = None,
    db: Session = Depends(get_db)
):
    """
    Upload a receipt image and extract data using OCR
    Returns extracted merchant, amount, date, and suggested category
    """
    try:
        # Get current user if authenticated (optional for testing)
        user = None
        if token:
            try:
                user = get_current_user(token, db)
            except:
                pass
        
        # Save uploaded file temporarily
        temp_dir = tempfile.mkdtemp()
        temp_file_path = os.path.join(temp_dir, file.filename)
        
        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
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
    data: ReceiptData,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Confirm and save extracted receipt data as a transaction
    Called after user reviews and confirms OCR extraction
    """
    try:
        user = get_current_user(token, db)
        
        # Validate category exists and belongs to user or is default
        category = db.query(Category).filter(
            Category.id == data.category_id
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Create transaction
        transaction = Transaction(
            user_id=user.id,
            category_id=data.category_id,
            amount=data.amount,  # Could be negative for expenses
            description=f"Receipt: {data.merchant}" if not data.description else data.description,
            date=datetime.fromisoformat(data.date)
        )
        
        db.add(transaction)
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
        "version": "1.0 (Beginner Friendly)"
    }
