# API Testing Guide

## Backend Health Check

```bash
# Start the backend
cd backend
uvicorn main:app --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

## Quick API Test Sequence

### 1. Check API Health
```bash
curl http://localhost:8000/health
```

Expected:
```json
{"status": "healthy", "timestamp": "2026-02-22T..."}
```

### 2. Register a User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "phone": "1234567890",
    "gender": "male",
    "password": "SecurePass123"
  }'
```

Expected:
```json
{"access_token": "eyJ...", "token_type": "bearer"}
```

### 3. Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### 4. Get Current User
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/auth/me
```

Expected:
```json
{
  "id": 1,
  "email": "test@example.com",
  "username": "testuser",
  "first_name": "Test",
  "last_name": "User",
  "available_balance": 0.0,
  ...
}
```

### 5. Create a Transaction
```bash
curl -X POST http://localhost:8000/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "amount": -50.00,
    "description": "Coffee at Cafe",
    "date": "2026-02-22"
  }'
```

### 6. Get All Transactions
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/transactions?page=1&limit=10"
```

Expected:
```json
{
  "transactions": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### 7. Get Categories
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/categories
```

### 8. Create Budget
```bash
curl -X POST http://localhost:8000/budgets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "amount": 500.00,
    "month": 2,
    "year": 2026
  }'
```

### 9. Get Monthly Analytics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/analytics/monthly?year=2026&month=2"
```

### 10. Get Savings Account
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/savings
```

---

## Validation Testing

### Test: Invalid Email
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "not-an-email",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "password": "SecurePass123"
  }'
```

Expected Error:
```json
{"detail": [...]}  // Email validation error
```

### Test: Weak Password
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "password": "123"  // Too short
  }'
```

Expected Error:
```json
{"detail": "Password must be at least 6 characters long"}
```

### Test: Invalid Date Format
```bash
curl -X POST http://localhost:8000/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "amount": -50.00,
    "description": "Test",
    "date": "22-02-2026"  // Wrong format
  }'
```

Expected Error:
```json
{"detail": "Date must be in YYYY-MM-DD format"}
```

### Test: Invalid Month in Budget
```bash
curl -X POST http://localhost:8000/budgets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "amount": 500.00,
    "month": 13,  // Invalid
    "year": 2026
  }'
```

Expected Error:
```json
{"detail": "Month must be between 1 and 12"}
```

### Test: Rate Limiting
Send 101+ requests in one minute to same endpoint:
```bash
for i in {1..110}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://localhost:8000/transactions &
done
wait
```

Expected (on request 101+):
```
HTTP 429 Too Many Requests
{"detail": "Rate limit exceeded. Maximum 100 requests per minute."}
```

---

## AI Features Testing

### Test: Get AI Summary
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/ai/progress?year=2026&month=2"
```

This returns **Server-Sent Events** - watch for:
```
data: {"type": "trying_model", "model": "google/gemini-2.0-flash-exp:free"}
data: {"type": "success", "model": "...", "summary": "..."}
```

### Test: Ask AI Question
```bash
curl -X POST http://localhost:8000/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 2,
    "question": "How can I reduce my food spending?"
  }'
```

---

## OCR/Receipt Testing

### Test: Upload Receipt
```bash
curl -X POST http://localhost:8000/ocr/upload-receipt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@receipt.jpg"
```

Expected:
```json
{
  "success": true,
  "data": {
    "merchant": "Cafe Coffee",
    "amount": 45.50,
    "date": "2026-02-22",
    "category_id": 1,
    "confidence": 92
  }
}
```

### Test: Confirm Receipt
```bash
curl -X POST http://localhost:8000/ocr/confirm-receipt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant": "Cafe Coffee",
    "amount": 45.50,
    "date": "2026-02-22",
    "category_id": 1,
    "description": "Receipt: Cafe Coffee"
  }'
```

---

## Report Generation Testing

### Test: Generate PDF Report
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/reports/generate" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "format": "pdf",
    "start_date": "2026-02-01",
    "end_date": "2026-02-28"
  }' \
  -o report.pdf
```

### Test: Generate CSV Report
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/reports/generate" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "start_date": "2026-02-01",
    "end_date": "2026-02-28"
  }' \
  -o report.csv
```

---

## Investment Testing

### Test: Add Investment
```bash
curl -X POST http://localhost:8000/investments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gold",
    "amount": 10,
    "buy_price": 7500.00,
    "buy_date": "2026-02-20"
  }'
```

### Test: Get Savings with Rates
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/savings
```

Expected:
```json
{
  "cash_balance": 5000.00,
  "investments": [
    {
      "type": "gold",
      "amount": 10,
      "buy_price": 7500.00,
      "current_rate": 7600.00,
      "current_value": 76000.00
    }
  ],
  "rates": {
    "gold": 7600.00,
    "silver": 250.00,
    "usd": 49.00,
    ...
  }
}
```

---

## Goal & Savings Testing

### Test: Create Savings Goal
```bash
curl -X POST http://localhost:8000/goals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emergency Fund",
    "target_amount": 10000.00,
    "current_amount": 2500.00,
    "target_date": "2026-12-31",
    "category_ids": [1, 2]
  }'
```

### Test: Set Long-Term Goal
```bash
curl -X POST http://localhost:8000/savings/long-term-goal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_amount": 50000.00,
    "target_date": "2028-12-31"
  }'
```

---

## Shopping List Testing

### Test: Save Shopping State
```bash
curl -X PUT http://localhost:8000/shopping/state \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopping_items": [
      {"name": "Milk", "quantity": 2},
      {"name": "Bread", "quantity": 1}
    ],
    "inventory_items": [
      {"name": "Eggs", "quantity": 12}
    ]
  }'
```

### Test: Get Shopping State
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/shopping/state
```

---

## Error Scenarios

### Missing Token
```bash
curl http://localhost:8000/transactions
```
Expected: `401 Unauthorized`

### Invalid Token
```bash
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:8000/transactions
```
Expected: `401 Unauthorized`

### Expired Token
(After 7 days or manually expired)
Expected: `401 Unauthorized - Token has expired. Please login again.`

### Duplicate Email on Register
```bash
# First registration succeeds
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", ...}'

# Second with same email
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", ...}'
```
Expected: `400 Bad Request - Email already registered`

---

## Performance Notes

1. **First Receipt Upload**: May take 30-60 seconds as EasyOCR loads (~2GB model)
2. **AI Responses**: Typically 5-15 seconds depending on model availability
3. **Market Rates**: Cached for 10 minutes after first request
4. **PDF Generation**: Usually completes in 2-5 seconds

---

## Debugging Tips

### Check Backend Logs
```bash
# If running with --reload, logs will show in terminal
uvicorn main:app --reload
```

### Test with Python
```python
import requests
import json

BASE_URL = "http://localhost:8000"

# Register
r = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "test@test.com",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "password": "Password123"
})
print(f"Register: {r.status_code}")
token = r.json()["access_token"]

# Get me
r = requests.get(f"{BASE_URL}/auth/me", 
    headers={"Authorization": f"Bearer {token}"})
print(f"Get Me: {r.status_code}")
print(json.dumps(r.json(), indent=2))
```

### Enable Debug Mode
In `main.py`, add before running:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## Status Codes Reference

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Transaction retrieved |
| 201 | Created | Transaction created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Transaction doesn't exist |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Unexpected error |

---

**All tests should pass with the fixed and validated code!**
