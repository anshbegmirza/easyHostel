# easyHostel4

Digital platform for hostel / PG operations: rooms, fees, complaints, notices, and role-based dashboards.

**v1:** one hostel (partner `hogwarts`)  
**Later:** more `hostels` rows — same code, no rewrite

## Stack

| Layer | Choice |
|--------|--------|
| Frontend | Angular 19+ (PWA), Angular Material |
| Backend | Node.js + Express (`/api/v1`) |
| Database | MySQL (`hostel_mgmt`) |
| Theme | Test: purple · Prod: green (`APP_MODE`). Optional override: `THEME_PALETTE` |

## Prerequisites

- Node.js 20+
- MySQL Server running locally

## Setup

```bash
cd backend
copy .env.example .env   # set DB_PASSWORD if needed
npm install
npm run db:setup
```

```bash
cd frontend
npm install
```

Demo accounts: [`docs/test-credentials.txt`](docs/test-credentials.txt)

## Run

```powershell
.\start-test.ps1
```

Or:

```bash
cd backend && npm run dev
cd frontend && npm start
```

- API: `http://localhost:3000/api/v1`
- App: `http://localhost:4200`
- Header: `X-Hostel-Partner: hogwarts` (sent automatically)

## 5-minute demo script

1. Login **staff1** / `staff@123` → Rooms → allocate **student2** into a free room  
2. Login **student1** / `std@123` → My room → Fees → Pay Sep due → open Receipt → Print  
3. Student → Complaints → open seeded ticket (or create one)  
4. Login **staff1** → Complaints → set **in progress** then **resolved** (timeline updates)  
5. Login **superuser** / `test@123` → Dashboard cards + Notices  
6. Toggle theme; on phone Chrome use Add to Home Screen (PWA)

Reset demo data anytime: `cd backend && npm run db:setup`

## Auth notes

- Local login for seeded accounts
- Google Sign-In when `GOOGLE_CLIENT_ID` is set; otherwise test Google dialog in `APP_MODE=test`
- Google users are always **tenants**

## Docs

- [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md) — same-day build plan
- [`docs/PLAN.md`](docs/PLAN.md) — original phased plan
- [`docs/information.txt`](docs/information.txt) — research / scale strategy
- [`docs/API.md`](docs/API.md) — endpoint list
- [`docs/ER.md`](docs/ER.md) — data model
- [`docs/test-credentials.txt`](docs/test-credentials.txt)
