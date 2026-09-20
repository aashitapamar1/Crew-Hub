# Crew Hub

AI-powered Digital Agency Management Platform. Internal tool for a digital agency to manage clients, freelancers, projects, tasks, files, and reporting from one place.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + bcrypt (RBAC)
- **Files**: Cloudinary
- **AI Service**: Python + FastAPI + scikit-learn

## Project Structure

```
crew-hub/
├── frontend/     React + Vite + Tailwind app
├── backend/      Express API + Prisma schema
└── ai-service/   FastAPI service for AI/ML features
```

## Getting Started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, etc.
npx prisma migrate dev --name init
npm run dev             # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev              # http://localhost:5173
```

### 3. AI Service

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000   # http://localhost:8000
```

## Health Checks

- Backend: `GET /api/health`
- AI Service: `GET /health`

## Status

Project setup complete (Step 1). Authentication module is next.
