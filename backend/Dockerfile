FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir reportlab==4.2.5 matplotlib==3.9.2 pandas==2.2.3 numpy==2.1.3 passlib==1.7.4 python-jose==3.3.0 python-dotenv==1.0.1

# Copy app files
COPY . .

# Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
