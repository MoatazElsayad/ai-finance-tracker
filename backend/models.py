"""
Database Models - All in ONE file for simplicity
This defines what data we store in the database
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# Keep Base here
Base = declarative_base()

# Association table for Goals and Categories (Many-to-Many)
goal_categories = Table(
    "goal_categories",
    Base.metadata,
    Column("goal_id", Integer, ForeignKey("goals.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)


class User(Base):
    """
    User accounts - people who use the app
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    avatar_seed = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    monthly_savings_goal = Column(Float, default=0.0)
    
    # Relationship: one user has many transactions
    transactions = relationship("Transaction", back_populates="user")
    budgets = relationship("Budget", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    investments = relationship("Investment", back_populates="user")


class Investment(Base):
    """
    User investments - Gold, Silver, Currencies
    """
    __tablename__ = "investments"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # "gold", "silver", "USD", "GBP", "EUR"
    amount = Column(Float, nullable=False)  # grams or currency amount
    buy_price = Column(Float, nullable=False)  # in EGP at time of purchase
    buy_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="investments")


class Category(Base):
    """
    Categories for transactions - can be default or user-created
    Like: Food, Transport, Salary, etc.
    """
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = default category
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "income" or "expense"
    icon = Column(String)  # emoji like 🍔 or 💰
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship: one category has many transactions
    transactions = relationship("Transaction", back_populates="category")
    user = relationship("User")


class Transaction(Base):
    """
    Financial transactions - the main data!
    Records every income and expense
    """
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Money details
    amount = Column(Float, nullable=False)  # Positive = income, Negative = expense
    description = Column(String)
    date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    amount = Column(Float, nullable=False) # e.g., 400.0
    month = Column(Integer, nullable=False) # 1-12
    year = Column(Integer, nullable=False)

    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category")


class Goal(Base):
    """
    Savings Goals - Track long-term financial targets
    """
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="goals")
    categories = relationship("Category", secondary=goal_categories)


# Pre-defined categories to insert when app starts
DEFAULT_CATEGORIES = [
    # Expenses
    {"id": 1, "name": "Food & Dining", "type": "expense", "icon": "🍔"},
    {"id": 2, "name": "Transportation", "type": "expense", "icon": "🚗"},
    {"id": 3, "name": "Shopping", "type": "expense", "icon": "🛍️"},
    {"id": 4, "name": "Bills", "type": "expense", "icon": "💡"},
    {"id": 5, "name": "Other Expense", "type": "expense", "icon": "📦"},
    
    # Income
    {"id": 6, "name": "Salary", "type": "income", "icon": "💰"},
    {"id": 7, "name": "Freelance", "type": "income", "icon": "💼"},
    {"id": 8, "name": "Other Income", "type": "income", "icon": "💵"},
]
