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
├── ai-service/   FastAPI service for AI/ML features
└── e2e/          Playwright end-to-end tests (drives frontend + backend together)
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

## Testing

### Backend integration tests (Jest + Supertest)

Runs against a dedicated `crewhub_test` database — never your dev data.

```bash
# one-time setup
createdb crewhub_test   # or: psql -c "CREATE DATABASE crewhub_test;"
cd backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crewhub_test?schema=public" npx prisma migrate deploy

npm test
```

Covers auth, RBAC across all three roles, client management, the project/task
workflow's integrity rules (team-membership enforcement, task ownership,
progress auto-derivation), and file access isolation between clients.

### End-to-end tests (Playwright)

Drives the real UI against a dedicated `crewhub_e2e` database. Automatically
starts its own backend + frontend dev servers (on ports 5050/5175, so it
won't collide with servers you already have running) and seeds the admin
account — Postgres just needs to be running.

```bash
createdb crewhub_e2e
cd e2e
npm install
npm test
```

`tests/full-workflow.spec.js` encodes the platform's fixed workflow as a
single regression test: Admin creates a Client and Freelancer, creates a
Project, assigns the Freelancer, creates a Task — then the Freelancer logs in,
sees the task, and marks it Completed — then the Admin confirms the project's
progress reflects it. Safe to re-run repeatedly; each run uses a unique
timestamp-based email/name suffix.

## Status

All 16 core modules are implemented: setup, auth, admin dashboard, client
management, freelancer management, project management, task management, file
management, communication, notifications, reports, AI features, and this
testing layer. Deployment is next.
