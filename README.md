# ArogyaMitra – AI Wellness Platform 💪

> AROMI AI Agent · React + FastAPI + PostgreSQL + Groq LLaMA-3.3-70B

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Copy and fill in your API keys
cp .env.example .env

# 2. Start everything (Postgres + Backend + Frontend)
docker-compose up --build
```

- **Frontend**: http://localhost:5173  
- **Backend API**: http://localhost:8000  
- **API Docs (Swagger)**: http://localhost:8000/docs  

---

### Option 2: Manual Setup

#### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp ../.env.example .env        # add your keys

# Run (SQLite-free: needs Postgres running first)
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL async connection string |
| `SECRET_KEY` | JWT signing secret (change in production!) |
| `GROQ_API_KEY` | [Groq Cloud](https://console.groq.com) – LLaMA 3.3-70B |
| `YOUTUBE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) |
| `SPOONACULAR_API_KEY` | [Spoonacular](https://spoonacular.com/food-api) |
| `GOOGLE_CLIENT_ID` | Google OAuth (Calendar integration) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |

> **Note:** The app works without API keys – it falls back to rich demo/mock data.

---

## Features

| Feature | Status |
|---|---|
| 12-question health assessment wizard | ✅ |
| AI 7-day workout plan (Groq LLaMA) | ✅ |
| AI 7-day meal plan + grocery list | ✅ |
| YouTube exercise video lookup | ✅ |
| AROMI AI coach chat with history | ✅ |
| Progress dashboard + charts | ✅ |
| Achievement badges | ✅ |
| Google Calendar sync | ✅ |
| JWT auth + role-based access | ✅ |
| Docker one-command deployment | ✅ |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, get JWT |
| GET | `/auth/me` | Current user |
| GET | `/assessment/questions` | 12 questions |
| POST | `/assessment/submit` | Submit responses |
| POST | `/workout/generate` | AI workout plan |
| GET | `/workout/plan` | Current plan |
| POST | `/nutrition/generate` | AI meal plan |
| GET | `/nutrition/grocery-list` | Grocery list |
| POST | `/coach/chat` | Chat AROMI |
| GET | `/coach/history` | Chat history |
| POST | `/progress/log` | Log daily metrics |
| GET | `/progress/dashboard` | Analytics |
| POST | `/calendar/sync` | Sync to Google Calendar |

Full interactive docs at `http://localhost:8000/docs`

---

## Architecture

```
arogya-mitra/
├── frontend/          # React + Vite + Zustand
│   └── src/
│       ├── pages/     # 9 route pages
│       ├── components/# Reusable UI (Navbar)
│       ├── store/     # Zustand auth + plan stores
│       └── services/  # Axios API wrapper
├── backend/           # FastAPI
│   └── app/
│       ├── models/    # SQLAlchemy ORM
│       ├── schemas/   # Pydantic schemas
│       ├── routers/   # 7 API routers
│       └── services/  # Groq AI service
├── docker-compose.yml
└── .env.example
```

## Tech Stack

- **Frontend**: React 18, Vite, Zustand, Recharts, Lucide Icons
- **Backend**: FastAPI, SQLAlchemy (async), Alembic
- **Database**: PostgreSQL 15
- **AI**: Groq LLaMA-3.3-70B
- **Auth**: JWT (python-jose + bcrypt)
- **Deploy**: Docker + Docker Compose
