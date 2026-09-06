# Hostel Management System — 7-Phase Build Plan

**Stack:** Angular 19+ (PWA) · Node.js (Express) · MySQL  
**Repo layout:** `frontend/` · `backend/` · `docs/` · root `README.md`  
**Scale rule:** one hostel in v1; every table/API scoped by `hostel_id` for multi-hostel later  
**UI:** mobile-first, installable PWA; themes like Works4 (light/dark) — green+white / green+black  

Do **not** push to git until the repo is initialized and you decide to.

---

## Target folder structure

```text
HOSTEL MANAGEMENT SYSTEM/
├── README.md
├── .gitignore
├── docs/
│   ├── information.txt      # research + scale strategy
│   └── PLAN.md              # this file
├── frontend/                # Angular 19+ PWA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # auth, theme, interceptors, guards
│   │   │   ├── shared/      # reusable UI (status badge, etc.)
│   │   │   ├── features/    # auth, dashboard, rooms, fees, complaints, profile
│   │   │   └── layout/      # shell / nav (role-aware, responsive)
│   │   ├── styles/
│   │   │   ├── _tokens.scss       # CSS variables (Works4-style theming)
│   │   │   ├── _theme-light.scss  # green + white
│   │   │   ├── _theme-dark.scss   # green + black
│   │   │   └── styles.scss
│   │   ├── environments/
│   │   ├── index.html
│   │   ├── manifest.webmanifest
│   │   └── ...
│   ├── angular.json
│   └── package.json
└── backend/                 # Express + MySQL
    ├── src/
    │   ├── config/
    │   ├── middleware/      # auth, hostel scope, errors
    │   ├── modules/
    │   │   ├── auth/
    │   │   ├── hostels/
    │   │   ├── users/
    │   │   ├── rooms/
    │   │   ├── fees/
    │   │   └── complaints/
    │   ├── app.js
    │   └── server.js
    ├── sql/
    │   ├── schema.sql       # includes hostels + hostel_id everywhere
    │   └── seed.sql         # one hostel + demo users
    ├── .env.example
    └── package.json
```

---

## Phase 0 — Bootstrap (this milestone)

**Goal:** Empty-but-runnable skeleton; safe to init git later and commit.

| Task | Done when |
|------|-----------|
| Root `README.md` + `.gitignore` + this plan | Files exist |
| `backend/` Express app + health route | `GET /api/health` returns OK |
| MySQL driver + `.env.example` + empty `schema.sql` / `seed.sql` stubs | Backend can read env; SQL files ready |
| `frontend/` Angular 19+ app | `ng serve` works |
| PWA scaffold (`@angular/pwa`) | Manifest + service worker config present |
| Theme tokens stub (light green/white, dark green/black) | Toggle-ready CSS variables (Works4 pattern: light + dark theme maps) |
| Mobile-friendly shell stub | Readable layout at phone width |

**Out of scope for Phase 0:** real auth, business APIs, full pages.

**MySQL on your machine:** install MySQL Community Server (or XAMPP/WAMP) if not already installed. Create an empty database (e.g. `hostel_mgmt`) when you start Phase 1. Phase 0 only prepares connection config.

---

## Phase 1 — Database + Auth + Hostel scope

**Goal:** Login works; every request knows `hostel_id`.

- [x] Finalize `schema.sql` with hostel partner + users + stub tables
- [x] Seed: hogwarts + superuser / staff1 / student1
- [x] JWT auth from MySQL; token has userId, role, hostelId
- [x] Middleware: resolveHostel (`X-Hostel-Partner`), requireAuth
- [x] Angular: Works4-style api-prefix + error interceptors, auth guards
- [x] Google GIS + test fallback; Google users are tenants
- [x] API under `/api/v1`
- [ ] MySQL must be running locally + `npm run db:setup` on your machine

**Exit check:** three roles can log in; API rejects unauthenticated calls (`/api/v1/secure/ping`).

---

## Phase 2 — Rooms + allocation

**Goal:** Occupancy is visible and allocatable.

- Admin: CRUD rooms (available / occupied / maintenance)
- Allocate / release bed or room to a tenant (hostel-scoped)
- Tenant: see “my room”
- Room matrix UI that works on mobile (list/cards; table optional on desktop)

**Exit check:** cannot double-book the same bed/room; status tags are clear.

---

## Phase 3 — Fees + receipts

**Goal:** Dues and payments are trusted.

- Monthly fee records + due / paid status
- Record payment (mock gateway OK for v1)
- Payment history + printable/downloadable receipt
- Admin dashboard card: pending dues

**Exit check:** tenant and admin see the same fee truth for the seeded hostel.

---

## Phase 4 — Complaints + timeline

**Goal:** No more “chase admin for status.”

- Tenant creates complaint (priority)
- Staff/admin updates status; append timeline events
- Tenant sees live status (polling is enough; sockets later)

**Exit check:** full path create → in progress → resolved with history.

---

## Phase 5 — Dashboard, notices, polish

**Goal:** Demo-ready operator + tenant experience.

- Dashboard cards: occupancy, revenue/dues, open complaints
- Simple notices list (optional but good for viva)
- Form validation, empty states, error toasts
- Responsive pass: phone + desktop

**Exit check:** 5-minute demo script works with seed data.

---

## Phase 6 — PWA + theme productization

**Goal:** Feels like an installable product (Works4-style theming, mobile install).

- Finish PWA: icons, manifest name, install prompt, offline shell
- Theme service: light (green + white) / dark (green + black); persist preference (localStorage)
- Same pattern as Works4 conceptually: **separate light & dark theme definitions**, switch at runtime — keep it CSS-variable based (do not copy Works4’s full Material multi-client monster)
- Touch targets, spacing, readable type on small screens
- Optional: hostel settings later can override accent (customizable theme hook)

**Exit check:** install on Android Chrome / iOS Safari “Add to Home Screen”; theme toggle survives refresh.

---

## Phase 7 — Harden, document, submit

**Goal:** Submission + future multi-hostel path is clear.

- README: how to run, demo accounts, env vars
- ER diagram + short API list in `docs/`
- Reset/seed script for live demo
- Security pass: password hashing, basic rate limit on login, CORS locked to frontend origin
- Note in docs: v2 = more `hostels` rows + super-admin (no rewrite)
- Init git and first commit when **you** are ready (not before)

**Exit check:** another machine can run frontend + backend + MySQL from README alone.

---

## Theme reference (Works4 → this product)

| Works4 idea | Our simpler version |
|-------------|---------------------|
| Light + dark theme objects | `:root[data-theme="light"]` / `dark` CSS variables |
| Per-client primary palette | Default green primary; later optional hostel accent |
| Runtime theme switch | `ThemeService` toggles `data-theme` on `<html>` |

**Defaults**

- **Light:** green primary, white / near-white surfaces, dark text  
- **Dark:** green primary, black / near-black surfaces, light text  

---

## Suggested order of work each week

1. One vertical slice (API + UI) before starting the next feature  
2. Keep seed data updated so demos never depend on manual DB clicking  
3. Mobile layout check on every feature (tenant flows especially)  
4. Do not start Phase 6 polish until Phases 1–4 work on desktop  

---

## Phase 0 checklist (current)

- [x] Plan written (`docs/PLAN.md`)
- [x] Root README + `.gitignore`
- [x] Backend Express scaffold
- [x] Frontend Angular 19+ scaffold
- [x] PWA + theme stubs (light/dark green)
- [ ] MySQL server installed locally (you) + DB created before Phase 1
- [ ] You init git / first commit when ready (no push until you say so)
