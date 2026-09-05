# Hostel Management System

Digital platform for hostel / PG operations: registration, rooms, fees, complaints, and role-based dashboards.

**v1:** one hostel, full product  
**Later:** same codebase, more hostels via `hostel_id` (see `docs/information.txt` Sheet 5)

## Stack

| Layer | Choice |
|--------|--------|
| Frontend | Angular 19+ (PWA, installable on phone) |
| Backend | Node.js + Express |
| Database | MySQL |
| Theme | Light: green + white · Dark: green + black (Works4-style light/dark switch) |

## Repo layout

```text
frontend/   → Angular app
backend/    → Express API
docs/       → research + PLAN.md
README.md   → this file
```

## Prerequisites

- Node.js 20+ (npm)
- MySQL Server (Community / XAMPP / WAMP) — needed from Phase 1
- Angular CLI (optional globally; `npx` works)

## Scripts

From the repo root (PowerShell):

```powershell
.\clean-install.ps1   # delete both node_modules, reinstall
.\start-test.ps1      # APP_MODE=test, open API + Angular windows
```

Git Bash / WSL:

```bash
bash ./clean-install.sh
bash ./start-test.sh
```

## Quick start (manual)

### Backend

```bash
cd backend
cp .env.example .env   # Windows: copy .env.example .env
npm install
npm run dev
```

API default: `http://localhost:3000`  
Health: `GET http://localhost:3000/api/health`  
Config (drives theme brand): `GET http://localhost:3000/api/config`

`APP_MODE=test` → purple theme · `APP_MODE=prod` → green theme

### Frontend

```bash
cd frontend
npm install
npm start
```

App default: `http://localhost:4200`

### Test login

- Username: `superuser`
- Password: `test@123`
- Or use **Continue with Google** (test dialog) / signup page

Signup is not open password registration — only superuser-created accounts or Google.

## Docs

- [`docs/PLAN.md`](docs/PLAN.md) — 7-phase build plan  
- [`docs/information.txt`](docs/information.txt) — AEIOU / product research  

## Git

Repo is not required to be initialized yet. Do not push until you create the remote and choose to.
