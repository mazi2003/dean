# Frontend PWA (`/frontend`)

Mobile-first React 19 + Vite 8 (Rolldown) + TypeScript + Tailwind CSS v4 Progressive Web App for **Digital Dean's Office of the Future (DemoTech University)**.

> *Competition concept, not an official university service. Fictional data.*

---

## 1. Key Capabilities & UX Design

- **Mobile-First & Responsive (`360px` to `4K`):** Bottom navigation bar on smartphones with $\ge 48\text{ px}$ touch targets (exceeding the 44px WCAG 2.1 AA requirement) and persistent sidebar on desktop viewports.
- **Core Student Flows:**
  - **Today (`TodayPage`):** Next class countdown, today's schedule, urgent dean's office announcements, active certificate requests, and semester progress.
  - **Schedule & Exams (`SchedulePage`):** Day/week views, prominent room-change/reschedule/cancellation badges, schedule collision detector, exam session timetable, and `.ics` calendar export.
  - **Grades (`GradesPage`):** GPA, 0–100 BRS points, ECTS credits progress, highlighted academic debt & retake dates, and illustrative Official Transcript preview.
  - **Requests & Certificates (`RequestsPage`):** 3-click dynamic application wizard, real-time status timeline (`submitted` → `in_review` → `needs_info` → `ready`), cancellation, and illustrative PDF preview.
  - **Notifications (`NotificationsPage`):** Filtered announcement & personal notification inbox with read/unread toggles.
  - **Profile & Digital Student ID (`ProfilePage`, `StudentCardModal`):** Full academic profile, dynamic 30s TOTP QR campus pass, and interactive NFC turnstile simulation.
  - **Academic Copilot (`AssistantModal`) & Campus Map (`CampusMapModal`):** Context-aware student Q&A and interactive building/room wayfinding.
- **Dean's Office Staff Portal (`StaffDashboardPage`, `StaffStudentsPage`):** Role-isolated workspace for processing student requests, inspecting academic groups and student dossiers, updating schedule/exam entries, and broadcasting announcements.
- **Bilingual & Accessible:** Instant `RU` / `EN` localization (`src/utils/i18n.ts`), light/dark theme with zero FOUC, self-hosted `Inter` Cyrillic/Latin `.woff2` subsets (OFL-1.1), and route-level code splitting (`React.lazy` + `Suspense`).

---

## 2. Environment Setup

Optional environment configuration (see [`.env.example`](./.env.example)):

```bash
cp .env.example .env.local
```

- `VITE_API_BASE_URL` — Defaults to `/api/v1` (proxied to `http://localhost:3000` in Vite dev server and via Nginx/Caddy/Vercel in production).

---

## 3. Commands

```bash
# Install dependencies
npm install

# Start Vite dev server (http://localhost:5173)
npm run dev

# Typecheck, lint (Oxlint + ESLint), and format check
npm run typecheck
npm run lint
npm run format:check

# Run component & i18n unit tests (Vitest + Testing Library)
npm test

# Build production PWA bundle (dist/)
npm run build
```
