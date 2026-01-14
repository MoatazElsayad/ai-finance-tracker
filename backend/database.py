"""
Database Setup - Simple SQLite connection
No need for complex configurations!
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
# Import Base and others from models
from models import Base, Category, DEFAULT_CATEGORIES 

DATABASE_URL = "sqlite:///./finance.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_database():
    """
    Initialize database - create all tables
    Run this once when app starts
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Add default categories if they don't exist
    db = SessionLocal()
    try:
        # Check if categories already exist
        existing = db.query(Category).first()
        if not existing:
            # Add default categories
            for cat_data in DEFAULT_CATEGORIES:
                category = Category(**cat_data)
                db.add(category)
            db.commit()
            print("✅ Default categories added!")
    finally:
        db.close()


def get_db():
    """
    Dependency to get database session
    Use this in FastAPI routes with Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()