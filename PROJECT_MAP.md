# PROJECT_MAP.md
> Persistent Architectural Intelligence for "Digital Dean's Office of the Future" (Demo University)
> Last updated: 2026-11-21

---

## 1. Technology Stack & Frameworks

| Domain | Technology / Framework |
| :--- | :--- |
| **Backend** | Node 20, TypeScript (strict), Fastify v5, Zod, Argon2, JSON Web Token (`jsonwebtoken`) |
| **Frontend** | React 19, TypeScript (strict), Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React |
| **Database** | PostgreSQL 16+, Prisma ORM (`schema.prisma`), `tsx` for seeding |
| **Testing** | Vitest (unit/integration for backend, frontend, database), Supertest, Playwright (E2E), k6 (load/smoke) |
| **Infrastructure** | Docker Compose, Caddyfile (reverse proxy / TLS), Vercel serverless build support |
| **Contract** | OpenAPI 3.0 (`/contract/openapi.yaml`), Seed specification (`/contract/seed-spec.md`) |

---

## 2. Directory Responsibilities

```
dean-office/
├── contract/       # Source of truth: openapi.yaml & seed-spec.md (never edit silently)
├── database/       # Prisma schema, migrations, seed data (seed.ts), schema tests
├── backend/        # Fastify REST API, middleware, auth, business logic, Vitest tests
├── frontend/       # React SPA + PWA, UI components, pages, context, styles
├── e2e/            # Playwright browser tests, k6 load testing scripts
├── deploy/         # Production deployment scripts and environment configs
├── docs/           # Competition logs (process-log.md), audits, screenshots, performance
├── scripts/        # Project-level utilities (audits, web vitals, db helpers)
├── AGENTS.md       # Mandatory rules for all AI agents (security, scope, quality)
├── TASK_RULES.md   # Focused workflow, token efficiency & change levels
└── PROJECT_MAP.md  # Persistent architecture map (this document)
```

---

## 3. Backend Architecture & Entry Points

- **Primary Entry Point:** `backend/src/server.ts` (standalone server launcher for local/Docker).
- **Serverless / App Factory:** `backend/src/app.ts` & `backend/src/createApp.ts` (configures plugins, CORS, helmet, cookies, rate-limiting, and registers all route plugins).
- **Core Libraries (`backend/src/lib/`):**
  - `config.ts`: Environment validation and secrets handling.
  - `prisma.ts`: Prisma client singleton with fallback handling (`serverlessFallbackPrisma.ts`).
  - `password.ts`: Argon2id password hashing and verification.
- **Middleware (`backend/src/middleware/`):**
  - `auth.ts`: JWT verification from httpOnly cookie (`dean_token`), user context injection, role verification (`STUDENT`, `STAFF`, `ADMIN`).
- **Routing Structure (`backend/src/routes/`):**
  - `/api/v1/auth`: `login`, `logout`, `me`, `password-reset-request`
  - `/api/v1/profile`: `GET /profile`, `PATCH /profile` (contact updates)
  - `/api/v1/schedule`: `GET /schedule` (day/week filter, group/student resolution)
  - `/api/v1/grades`: `GET /grades` (summary, GPA, credits, term filters)
  - `/api/v1/requests`: `GET /requests`, `POST /requests`, `GET /requests/types` (certificates & requests)
  - `/api/v1/notifications`: `GET /notifications`, `PATCH /notifications/:id/read`
  - `/api/v1/staff`: Staff management endpoints (`/staff/requests`, `/staff/announcements`, `/staff/students`)
  - `/api/v1/assistant`: AI Dean's assistant chat endpoint (strictly scoped to user data)

---

## 4. Frontend Architecture & Entry Points

- **Entry Point:** `frontend/src/main.tsx` (mounts React root, service worker registration).
- **Layout & Routing:** `frontend/src/App.tsx` (manages tab navigation, auth guard, layout shells, global modals).
- **Global State & Context (`frontend/src/context/`):**
  - `AuthContext.tsx`: User profile, auth tokens/session status, theme (`light`/`dark`), accessibility mode, language (`ru`/`en`), and unread notification counter.
- **Pages (`frontend/src/pages/`):**
  - `LoginPage.tsx`: Accessible login with demo credentials picker and validation.
  - `TodayPage.tsx`: Daily dashboard, today's classes, urgent announcements, quick action cards.
  - `SchedulePage.tsx`: Interactive timetable, week switcher, class details, room map trigger.
  - `GradesPage.tsx`: Grade breakdown, credit tracking, GPA calculation, official transcript modal trigger.
  - `RequestsPage.tsx`: Certificate application, status tracking, preview and PDF download.
  - `NotificationsPage.tsx`: Push and system notification inbox, mark as read, filters.
  - `ProfilePage.tsx`: Student ID card, dossier, contact settings, theme/language preferences.
  - `StaffDashboardPage.tsx` & `StaffStudentsPage.tsx`: Dean's office staff management panel.
- **API Client (`frontend/src/services/api.ts`):**
  - Typed API wrappers over native `fetch` with `credentials: 'include'` for secure cookie exchange.

---

## 5. Database Architecture & Models

Defined in `database/schema.prisma` (PostgreSQL):
- **Identity & Access:** `User` (email, argon2 passwordHash, role: STUDENT/STAFF/ADMIN), `StudentProfile` (studentCardNumber, course, status, avatar).
- **Academic Structure:** `Faculty`, `Program`, `Group`.
- **Curriculum & Schedule:** `Subject`, `Teacher`, `Room`, `ScheduleEntry` (weekday, lessonNumber, time slots, parity), `Exam`.
- **Academic Performance:** `Grade` (ECTS grade, score, points, term).
- **Dean's Office Workflow:** `RequestType`, `Request` (status: DRAFT, SUBMITTED, IN_REVIEW, READY, REJECTED), `RequestStatusHistory`.
- **Communication:** `Notification`, `Announcement`.

---

## 6. Authentication & Security Model

- **Credentials:** Argon2id hash only. No plaintext passwords or hashes logged.
- **Session Transport:** HTTP-only, `Secure`, `SameSite=Lax` signed cookies (`dean_token`). No tokens stored in `localStorage`.
- **Authorization & Ownership:**
  - Every student endpoint verifies ownership: student ID is derived strictly from the verified JWT payload. Foreign IDs return 404.
  - Staff routes enforce server-side role check (`STAFF` or `ADMIN`).
- **Security Headers:** `@fastify/helmet` with strict CSP; CORS locked to origin; rate limiting on `/auth/login`.

---

## 7. Design System & UI Styling

- **Framework:** Tailwind CSS v4 (`frontend/src/index.css`).
- **Visual Identity:** Modern institutional aesthetic, high contrast, clean typography, responsive layout down to 360px viewport.
- **Accessibility:** 44px minimum touch targets, WCAG AA color contrast compliance, dedicated accessible high-contrast toggle.
- **Mandatory UI Requirement:** Every page footer displays:
  `"Competition concept, not an official university service. Fictional data."`
- **Component Palette (`frontend/src/components/`):**
  `Header`, `Sidebar`, `BottomNav`, `Footer`, `UniversityEmblem`, `StudentCardModal`, `CampusMapModal`, `CertificatePreviewModal`, `OfficialTranscriptModal`, `AssistantModal`, `ScheduleCollisionAlert`.

---

## 8. Build, Development & Testing Commands

### Backend (`/backend`)
- Run Dev: `npm run dev`
- Build / Typecheck: `npm run typecheck` / `npm run build:tsc`
- Run Tests: `npm run test` (Vitest)
- Lint / Format: `npm run lint` / `npm run format:check`

### Frontend (`/frontend`)
- Run Dev: `npm run dev` (Vite)
- Build / Typecheck: `npm run build` / `npm run typecheck`
- Run Tests: `npm run test` (Vitest)
- Lint: `npm run lint` (Oxlint + ESLint)

### Database (`/database`)
- Generate Client: `npm run db:generate`
- Run Migrations: `npm run db:migrate` (dev) / `npm run db:migrate:deploy` (prod)
- Seed Database: `npm run db:seed`
- Run Tests: `npm run test`

### End-to-End (`/e2e`)
- Playwright E2E: `npx playwright test`
- Performance/Smoke: `node load-smoke.mjs` / `k6 run k6-smoke.js`
