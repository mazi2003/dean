# Agent 3: Frontend
```
Read /AGENTS.md and /contract/openapi.yaml. Work ONLY in /frontend.
Build a React 18 + Vite + TypeScript + Tailwind PWA, MOBILE-FIRST (min width 360px; bottom tab bar on
phone, sidebar on desktop). Develop against a mock API (MSW) generated from the contract so you do not
depend on the backend; API base URL from env; requests use credentials:'include'.
Screens:
1. Login (error states, show/hide password) + footer notice.
2. Today: next class, today's classes, upcoming deadlines, request status cards, unread notifications.
3. Schedule: day/week toggle, badges for room changed / moved / cancelled.
4. Grades: subject list, credits progress ring, average + GPA, upcoming exams, failed subjects highlighted.
5. Requests: new-request wizard from /request-types (dynamic form), list, detail with status timeline,
   expected date, cancel button.
6. Notifications: filters, unread badge, mark read / read all.
7. Profile: full name, faculty, program, year, group.
8. Staff (role=staff): requests inbox with filters, change status with comment, post announcement,
   change a schedule entry.
9. Optional assistant chat bubble.
Design: original logo (SVG, NOT any real university logo), cohesive palette, dark mode, skeleton loaders,
friendly empty states and error states, 44px touch targets, WCAG AA contrast, keyboard navigation,
EN/RU i18n, reduced-motion respect. Fonts/icons: open-license only (e.g. Inter, Lucide).
Every page footer: "Competition concept, not an official university service. Fictional data."
Never store tokens in localStorage; no secrets in the bundle.
Tests: Vitest + Testing Library for key components; Lighthouse mobile >=90 performance and accessibility.
Deliver: app, Dockerfile (nginx), README, screenshots at 360px and desktop in /docs/screens.
Log work and AI mistakes in /docs/process-log.md.
```
