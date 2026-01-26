import sys
import os

# Add the backend directory to sys.path to allow local imports
backend_path = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.append(backend_path)

# Now we can import the FastAPI app from main.py
from main import app

# Set the root path for Vercel deployment so that routes match /api/...
app.root_path = "/api"
