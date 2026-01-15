# 💰 Simple Finance Tracker

A beginner-friendly finance tracking app with AI insights, built with **React** and **FastAPI**.

Perfect for learning full-stack development!

---

## ✨ Features

- 📝 Track income and expenses
- 📊 Budget planning & financial insights
- 🤖 AI-powered financial insights (OpenAI)
- 🔐 Secure authentication (JWT)
- 🎨 Modern, clean UI (Tailwind CSS)

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (optional but recommended)

### Option 1: Run with Docker (Easiest!)

```bash
# 1. Clone the repo
git clone <your-repo>
cd simple-finance-tracker

# 2. Create .env file
cp .env.example .env
# Edit .env and add your OpenAI API key

# 3. Start everything!
docker-compose up --build

# 4. Open in browser
# Frontend: http://localhost:3000
# Backend API Docs: http://localhost:8000/docs
```

### Option 2: Run Manually

#### Backend Setup

```bash
# 1. Go to backend folder
cd backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
export SECRET_KEY="your-secret-key"
export OPENAI_API_KEY="sk-your-key"

# 5. Run the server
python -m uvicorn main:app --reload

# Backend runs on: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

#### Frontend Setup

```bash
# 1. Open new terminal, go to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# Frontend runs on: http://localhost:3000
```

---

## 📁 Simple Project Structure

```
simple-finance-tracker/
├── backend/                  # Python/FastAPI
│   ├── main.py              # ⭐ ALL API routes (250 lines!)
│   ├── models.py            # Database models
│   ├── database.py          # Database setup
│   ├── requirements.txt     # Just 6 packages!
│   └── Dockerfile
│
├── frontend/                 # React
│   ├── src/
│   │   ├── api.js           # ⭐ ALL API calls
│   │   ├── App.jsx          # Main app + routing
│   │   ├── main.jsx         # React entry point
│   │   └── pages/           # 4 simple pages
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Transactions.jsx
│   │       └── Analytics.jsx
│   ├── package.json
│   └── Dockerfile
│
├── .env                      # Your API keys
├── docker-compose.yml        # One command to run
└── README.md                 # This file!
```

**Total: 11 core files!** Easy to understand everything! 🎓

---

## 🎓 Learning Path

### Backend (Python/FastAPI)

1. **models.py** - Learn how databases work
   - 3 tables: User, Category, Transaction
   - Simple relationships

2. **database.py** - Database connection
   - SQLite (file-based, simple!)
   - Auto-creates tables

3. **main.py** - ALL your API routes
   - Authentication (register/login)
   - CRUD operations
   - Analytics
   - AI integration

### Frontend (React)

1. **api.js** - Learn HTTP requests
   - Simple fetch() calls
   - Token management

2. **App.jsx** - React Router basics
   - Protected routes
   - Navigation

3. **Login.jsx** - Forms in React
   - useState hook
   - Form handling

4. **Dashboard.jsx** - Data fetching
   - useEffect hook
   - API integration

5. **Transactions.jsx** - CRUD in React
   - Add, delete operations
   - Tables

6. **Analytics.jsx** - Data visualization
   - Recharts library
   - Simple charts

---

## 🔑 Getting OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign up / Log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to `.env` file

**Note:** You'll need to add credits to your OpenAI account (starts at $5).

---

## 📖 API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Transactions
- `GET /transactions` - List all
- `POST /transactions` - Add new
- `DELETE /transactions/{id}` - Delete

### Analytics
- `GET /analytics/monthly?year=2026&month=1` - Monthly stats

### AI
- `POST /ai/summary?year=2026&month=1` - Generate AI insight

### Other
- `GET /categories` - List all categories
- `GET /` - API info
- `GET /docs` - Interactive API documentation

---

## 🎨 Features Explained

### Dashboard
- See your monthly income, expenses, and savings
- View recent transactions
- Generate AI insights with one click

### Transactions
- Add income or expenses
- Choose from pre-defined categories
- See all transactions in a table
- Delete transactions

### Analytics
- View monthly statistics
- Bar chart: Income vs Expenses
- Pie chart: Spending by category
- Navigate between months

---

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Find process using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

**Database file locked:**
```bash
# Delete the database and restart
rm finance.db
```

### Frontend Issues

**Port 3000 already in use:**
```bash
# Change port in vite.config.js
server: { port: 3001 }
```

**API calls fail:**
- Make sure backend is running on port 8000
- Check browser console for errors
- Verify CORS is enabled in main.py

---

## 🚀 Next Steps

Once you understand this simple version, you can:

1. **Add more features:**
   - Budget tracking
   - Recurring transactions
   - Export to CSV
   - Dark mode

2. **Improve the UI:**
   - Add animations
   - Better mobile design
   - More chart types

3. **Advanced backend:**
   - PostgreSQL instead of SQLite
   - Email notifications
   - PDF reports
   - Multiple AI providers

4. **Deploy it:**
   - Frontend: Vercel, Netlify
   - Backend: Railway, Render, Heroku

---

## 📚 Learn More

- **FastAPI:** https://fastapi.tiangolo.com/
- **React:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Recharts:** https://recharts.org/

---

## 🤝 Contributing

This is a learning project! Feel free to:
- Add features
- Improve documentation
- Fix bugs
- Share with others

---

## 📄 License

MIT License - Use it however you want!

---

## 🎉 You Did It!

You now have a working full-stack app with:
- ✅ React frontend
- ✅ FastAPI backend
- ✅ SQLite database
- ✅ AI integration
- ✅ Beautiful UI

**Keep building and learning! 🚀**

---