# TradeFlo — Complete Setup Guide

## Prerequisites

Before running TradeFlo, ensure you have:
- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **Python** 3.10+ ([python.org](https://python.org))
- **PostgreSQL** 14+ ([postgresql.org](https://postgresql.org))

---

## Step 1 — Database Setup

### Create the PostgreSQL database

Open psql or pgAdmin and run:
```sql
CREATE DATABASE tradeflo;
CREATE USER tradeflo_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE tradeflo TO tradeflo_user;
```

Or simply use the default `postgres` user:
```sql
CREATE DATABASE tradeflo;
```

---

## Step 2 — Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy env file and configure
Copy-Item .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/tradeflo
GEMINI_API_KEY=your-gemini-api-key  # Get free at aistudio.google.com
```

### Run migrations (creates all tables automatically)
```powershell
# Tables are created automatically on first startup via SQLAlchemy
# No manual migration needed for initial setup
uvicorn main:app --reload --port 8000
```

Backend will be live at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

---

## Step 3 — Frontend Setup

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be live at: **http://localhost:3000**

---

## Step 4 — Create Your First Account

1. Open **http://localhost:3000**
2. You'll be redirected to the Dashboard
3. Go to **Settings** (`/settings`)
4. Fill in your account details:
   - Account Name (e.g. "FTMO Challenge")
   - Broker name
   - Initial balance
   - Risk limits (daily loss %, max drawdown %, risk per trade %)
5. Click **Create Account**

---

## Step 5 — Log Your First Trade

1. Navigate to **Journal** (`/journal`)
2. Click **Log Trade**
3. Fill in the trade form:
   - Symbol (EURUSD, XAUUSD, etc.)
   - Direction (BUY/SELL)
   - Entry/Exit prices
   - Lot size, P&L, R:R ratio
   - Setup tag and notes
4. Click **Save Trade**

The Dashboard and Analytics pages will immediately update with your data.

---

## Step 6 — AI Coach

1. Navigate to **AI Coach** (`/ai-coach`)
2. Try starter prompts like "Review my performance"
3. For full AI responses, add your Gemini API key to `backend/.env`

**Get a free Gemini API key:**
Visit [aistudio.google.com](https://aistudio.google.com) → API Keys → Create

---

## Running Both Servers

Open two PowerShell windows:

**Terminal 1 (Backend):**
```powershell
.\start-backend.ps1
```

**Terminal 2 (Frontend):**
```powershell
.\start-frontend.ps1
```

---

## Project Structure

```
TradeFlo/
├── frontend/               # Next.js App (port 3000)
│   └── src/
│       ├── app/            # Pages (dashboard, chart, journal, etc.)
│       ├── components/     # Reusable components
│       └── lib/            # API client + types
├── backend/                # FastAPI App (port 8000)
│   ├── ai/                 # AI engine (stats, patterns, risk, chat)
│   ├── routers/            # API route handlers
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── main.py             # FastAPI entrypoint
│   └── .env                # Your configuration
├── docs/                   # Documentation
├── start-backend.ps1       # Backend startup script
└── start-frontend.ps1      # Frontend startup script
```
