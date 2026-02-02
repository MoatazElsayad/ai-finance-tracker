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
                
        except Exception as e:
            print(f"Migration error: {e}")
    
    # Add default categories if they don't exist
    db = SessionLocal()
    try:
        # Check for missing default categories and add them
        for cat_data in DEFAULT_CATEGORIES:
            # Check by ID first since these are fixed default categories
            id_match = db.query(Category).filter(Category.id == cat_data["id"]).first()
            
            if id_match:
                # If it's a default category (user_id is None), update it
                if id_match.user_id is None:
                    id_match.name = cat_data["name"]
                    id_match.type = cat_data["type"]
                    id_match.icon = cat_data["icon"]
                    print(f"Ensured default category: {cat_data['name']}")
                else:
                    # ID is taken by a user category? This is bad but we must handle it.
                    # We can't insert a new one with this ID.
                    # Let's check if the category exists by name instead.
                    name_match = db.query(Category).filter(
                        Category.name == cat_data["name"],
                        Category.type == cat_data["type"],
                        Category.user_id == None
                    ).first()
                    
                    if name_match:
                        name_match.icon = cat_data["icon"]
                        print(f"Ensured default category (by name): {cat_data['name']}")
                    else:
                        print(f"Warning: Default category ID {cat_data['id']} is taken by user. Skipping {cat_data['name']}.")
            else:
                # ID not taken, but maybe name/type exists?
                name_match = db.query(Category).filter(
                    Category.name == cat_data["name"],
                    Category.type == cat_data["type"],
                    Category.user_id == None
                ).first()
                
                if name_match:
                    name_match.icon = cat_data["icon"]
                    # We could try to update the ID here, but it's risky
                    print(f"Ensured default category (by name): {cat_data['name']}")
                else:
                    # Create new
                    category = Category(**cat_data)
                    db.add(category)
                    print(f"Adding missing default category: {cat_data['name']}")
        
        db.commit()
    except Exception as e:
        print(f"Database seeding error: {e}")
        db.rollback()
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
