"""
Database Setup - Simple SQLite connection
No need for complex configurations!
"""
from sqlalchemy import create_engine, text
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
    
    # Ensure necessary columns exist in users table
    with engine.begin() as conn:
        try:
            # PRAGMA doesn't work well with text() in some cases, use exec_driver_sql
            cols = conn.exec_driver_sql("PRAGMA table_info(users)").fetchall()
            col_names = [c[1] for c in cols]
            
            if "gender" not in col_names:
                print("Adding 'gender' column to users table...")
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN gender TEXT")
                
            if "avatar_seed" not in col_names:
                print("Adding 'avatar_seed' column to users table...")
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN avatar_seed TEXT")
                
            if "monthly_savings_goal" not in col_names:
                print("Adding 'monthly_savings_goal' column to users table...")
                conn.exec_driver_sql("ALTER TABLE users ADD COLUMN monthly_savings_goal FLOAT DEFAULT 0.0")
                
            # Check market_rates_cache columns for expanded currency support
            rates_cols = conn.exec_driver_sql("PRAGMA table_info(market_rates_cache)").fetchall()
            rates_col_names = [c[1] for c in rates_cols]
            
            new_currencies = [
                "sar_to_egp", "aed_to_egp", "kwd_to_egp", "qar_to_egp", 
                "bhd_to_egp", "omr_to_egp", "jod_to_egp", "try_to_egp", 
                "cad_to_egp", "aud_to_egp"
            ]
            
            for curr_col in new_currencies:
                if curr_col not in rates_col_names:
                    print(f"Adding '{curr_col}' column to market_rates_cache table...")
                    conn.exec_driver_sql(f"ALTER TABLE market_rates_cache ADD COLUMN {curr_col} FLOAT")
            
            if "updated_at" not in rates_col_names:
                print("Adding 'updated_at' column to market_rates_cache table...")
                conn.exec_driver_sql("ALTER TABLE market_rates_cache ADD COLUMN updated_at DATETIME")
                    
        except Exception as e:
            print(f"Migration error: {e}")
    
    # Add default categories if they don't exist
    db = SessionLocal()
    try:
        # First, remove existing default categories (those with user_id = None)
        # as the system now relies on custom categories for personalization.
        db.query(Category).filter(
            Category.user_id == None
        ).delete(synchronize_session=False)
        db.commit()
        print("Cleaned up old default categories.")
    except Exception as e:
        print(f"Error cleaning default categories: {e}")
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
