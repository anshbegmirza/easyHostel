# easyHostel4

Digital platform for hostel / PG operations: registration, rooms, fees, complaints, and role-based dashboards.

**v1:** one hostel (partner `hogwarts`), full product foundation  
**Later:** `hogwarts.easyHostel4.com`-style tenancy via hostel partner / subdomain

## Stack

| Layer | Choice |
|--------|--------|
| Frontend | Angular 19+ (PWA), Angular Material M2 themes |
| Backend | Node.js + Express (`/api/v1`) |
| Database | MySQL (`hostel_mgmt`) |
| Theme | Test: purple · Live/prod: green (from `APP_MODE`) |

## Repo layout

```text
frontend/   → Angular app (Works4-like core/http + pages)
backend/    → Express API
docs/       → research, plan, test credentials
```

## Prerequisites

- Node.js 20+
- MySQL Server running locally

## Database setup

```bash
cd backend
copy .env.example .env   # set DB_PASSWORD if needed
npm install
npm run db:setup
```

Creates `hostel_mgmt`, schema, and seed users. See [`docs/test-credentials.txt`](docs/test-credentials.txt).

## Scripts

```powershell
.\clean-install.ps1
.\start-test.ps1
```

Or manually:

```bash
cd backend && npm run dev
cd frontend && npm start
```

- API: `http://localhost:3000/api/v1`
- App: `http://localhost:4200`
- Hostel header: `X-Hostel-Partner: hogwarts` (frontend sends this automatically)

## Auth

- Local login for superuser-created accounts
- Google Sign-In (GIS) when `GOOGLE_CLIENT_ID` is set; otherwise test Google dialog in `APP_MODE=test`
- Google users are always **tenants** on the resolved hostel

### Google Cloud (Web client)

1. OAuth consent screen (External) + test users while in Testing  
2. Credentials → OAuth client ID → Web  
3. Authorized JavaScript origins: `http://localhost:4200`  
4. Put Client ID in `backend/.env` as `GOOGLE_CLIENT_ID=...` (never commit secrets)

## Theme

`APP_MODE=test` → purple · `APP_MODE=prod` → green

## Docs

- [`docs/PLAN.md`](docs/PLAN.md)
- [`docs/information.txt`](docs/information.txt)
- [`docs/test-credentials.txt`](docs/test-credentials.txt)
