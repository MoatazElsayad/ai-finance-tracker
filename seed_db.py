
import sys
import os

# Add backend to path so we can import from it
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

try:
    from database import init_database
    print("Starting database initialization...")
    init_database()
    print("Database initialization completed successfully!")
except Exception as e:
    print(f"Error during database initialization: {e}")
    sys.exit(1)
