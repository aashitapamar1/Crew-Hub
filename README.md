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

## Continuous Integration

`.github/workflows/ci.yml` runs on every push/PR: the backend Jest suite
against a real Postgres service container, a production frontend build, and
an import/init sanity check for the AI service.

## Deployment

### Option A — Docker Compose (single machine / VPS)

Builds and runs all four pieces together: Postgres, the Express API, the
FastAPI AI service, and the frontend served by nginx (which reverse-proxies
`/api/*` and `/uploads/*` to the backend, so the browser only ever talks to
one origin — no CORS configuration needed in production).

```bash
cp .env.docker.example .env   # set JWT_SECRET, SEED_ADMIN_PASSWORD, etc.
docker compose up -d --build
```

- Frontend: `http://<host>:8080`
- Backend API: `http://<host>:5000/api` (also reachable at `/api` through the frontend)
- AI service: `http://<host>:8000`

The backend container runs `prisma migrate deploy` and the idempotent admin
seed script on every start, so the schema and the first admin account are
always up to date without a manual step. Uploaded files persist in the
`backend_uploads` named volume when Cloudinary isn't configured.

This compose file's YAML and variable interpolation were validated with
`docker compose config` in this environment; the actual image builds were
not run here (no Docker daemon access in this sandbox) — build and smoke-test
it once in an environment with Docker before relying on it for a real
deployment.

### Option B — Separate managed platforms (no server to maintain)

A common split for a student/portfolio deployment with generous free tiers:

| Piece | Suggested host | Notes |
|---|---|---|
| PostgreSQL | Render, Railway, or Neon | Copy the connection string into `DATABASE_URL` |
| Backend (Express) | Render or Railway | Build: `npm ci`; Start: `npx prisma migrate deploy && node prisma/seed.js && node src/server.js` |
| AI service (FastAPI) | Render | Build: `pip install -r requirements.txt`; Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Frontend (static build) | Vercel or Netlify | Build: `npm run build`; publish `frontend/dist`; set `VITE_API_URL` to the deployed backend's `/api` URL at build time |

With this split, set the backend's `FRONTEND_URL` to the deployed frontend's
origin (for CORS) and the AI service URL to wherever the FastAPI service
ends up.

### Production checklist

- [ ] Real `CLOUDINARY_*` credentials (without them, uploaded files land on
      local disk, which doesn't survive a redeploy on most platforms)
- [ ] Real SMTP `EMAIL_*` credentials (without them, password-reset and
      account-creation emails are only logged to the server console)
- [ ] A long, random `JWT_SECRET` — never the development default
- [ ] `FRONTEND_URL` set to the real deployed frontend origin
- [ ] `SEED_ADMIN_PASSWORD` changed from any placeholder before first boot,
      and the admin password rotated again after first login
- [ ] `npx prisma migrate deploy` (not `migrate dev`) is what runs in production

## Status

All 16 steps of the build order are complete: setup, database/Prisma, auth,
admin dashboard, client management, freelancer management, project
management, task management, file management, communication, notifications,
reports, AI features, automated testing (backend integration tests +
Playwright E2E), and this deployment layer.
