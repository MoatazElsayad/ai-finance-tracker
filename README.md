# 💰 AI-Powered Finance Tracker

A professional, full-stack financial management application built with **React** and **FastAPI**. This project features advanced AI insights, automated receipt scanning, and comprehensive budget tracking designed for a modern user experience.

---

## ✨ Key Features

- **📊 Comprehensive Dashboard**: Real-time overview of income, expenses, and net savings with interactive trends.
- **🤖 AI Financial Advisor**: Integrated with OpenRouter to provide personalized financial analysis and actionable recommendations.
- **📸 Smart Receipt Scanning**: Automated transaction entry using OCR (EasyOCR/Tesseract) to extract data from receipt images.
- **🎯 Savings Goals**: Track long-term financial targets with automated progress monitoring linked to specific categories.
- **💸 Budget Management**: Set monthly limits per category and receive AI-driven alerts for overspending.
- **📄 PDF Reports**: Generate professional, beautifully formatted financial reports with charts and AI insights.
- **🔐 Secure & Private**: JWT-based authentication with encrypted password storage.
- **🎨 Modern Dark UI**: High-performance, responsive interface built with Tailwind CSS and Framer Motion.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- SQLite (included)

### 🛠️ Backend Setup
1. **Navigate to backend**: `cd backend`
2. **Virtual Environment**: 
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
3. **Install Dependencies**: `pip install -r requirements.txt`
4. **Environment Variables**: Create a `.env` file in the `backend/` directory:
   ```env
   SECRET_KEY="your-random-secret-key"
   OPENROUTER_API_KEY="your-openrouter-key"
   ```
5. **Run Server**: `uvicorn main:app --reload`

### 💻 Frontend Setup
1. **Navigate to frontend**: `cd frontend`
2. **Install Dependencies**: `npm install`
3. **Start Development Server**: `npm run dev`

---

## 📁 Project Structure

```text
ai-finance-tracker/
├── backend/                  # FastAPI Application
│   ├── main.py              # Core API, AI logic & PDF generation
│   ├── models.py            # SQLAlchemy database schemas
│   ├── database.py          # SQLite connection & auto-migrations
│   ├── ocr_utils.py         # OCR processing for receipts
│   └── requirements.txt     # Backend dependencies
├── frontend/                 # React Application
│   ├── src/
│   │   ├── api.js           # Centralized API service
│   │   ├── pages/           # Dashboard, Goals, Budget, OCR, etc.
│   │   └── components/      # Reusable UI components
│   └── tailwind.config.js   # Styling configuration
└── .env                      # Global environment settings
```

---

## 🎓 Core Technical Concepts

### 1. AI Integration
The app uses a "Model-Fallback" system. It attempts to reach multiple free AI models via **OpenRouter** (like Gemini 2.0, DeepSeek, or Llama 3) to ensure you always get an analysis, even if one provider is busy.

### 2. Intelligent OCR
When you upload a receipt, the system:
1. Processes the image locally using **EasyOCR** or **Pytesseract**.
2. Falls back to an online OCR API if local tools aren't installed.
3. Uses AI to structure the messy text into a clean `Amount`, `Category`, and `Date`.

### 3. Automated Savings Tracking
The "Savings" category is special. Transactions tagged as savings are automatically credited toward your active **Savings Goals**, allowing you to see your progress move in real-time.

---

## 📖 Main API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/auth/login` | `POST` | Authenticate and receive JWT |
| `/transactions` | `GET/POST` | Manage financial records |
| `/ocr/upload` | `POST` | Scan receipt images |
| `/budgets` | `GET/POST` | Set and view category limits |
| `/goals` | `GET/POST` | Track savings targets |
| `/analytics/report` | `GET` | Generate PDF Financial Report |
| `/ai/chat` | `POST` | Interactive financial advisor |

---

## 🤝 Contributing
This project is open for educational purposes. Feel free to fork, add new features like "Export to CSV" or "Bank Sync", and improve the UI.

## 📄 License
MIT License - Build something great!
