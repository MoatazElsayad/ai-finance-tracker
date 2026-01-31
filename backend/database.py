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
    
    # Ensure 'gender' and 'avatar_seed' columns exist in users table
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
                
        except Exception as e:
            print(f"Migration error: {e}")
    
    # Add default categories if they don't exist
    db = SessionLocal()
    try:
        # Check for missing default categories and add them
        for cat_data in DEFAULT_CATEGORIES:
            # Check by name and type to be more robust than just ID
            exists = db.query(Category).filter(
                Category.name == cat_data["name"],
                Category.type == cat_data["type"],
                Category.user_id == None
            ).first()
            
            if not exists:
                # If name exists but type/id is different, it might be an old version
                # Check if we should update an existing category name or ID
                id_match = db.query(Category).filter(Category.id == cat_data["id"]).first()
                if id_match and id_match.user_id is None:
                    # Update existing default category with this ID
                    id_match.name = cat_data["name"]
                    id_match.type = cat_data["type"]
                    id_match.icon = cat_data["icon"]
                    print(f"Updated default category ID {cat_data['id']}: {cat_data['name']}")
                else:
                    # Create new
                    category = Category(**cat_data)
                    db.add(category)
                    print(f"Adding missing default category: {cat_data['name']}")
            else:
                # Update existing default category to match models.py (especially icon and type)
                exists.icon = cat_data["icon"]
                exists.type = cat_data["type"]
                # Also ensure ID matches if possible, but SQLAlchemy doesn't like changing PKs
                print(f"Ensured default category: {cat_data['name']}")
        
        db.commit()
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
