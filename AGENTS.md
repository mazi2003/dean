# AGENTS.md: rules for every AI agent in this repo

## Project
"Digital Dean's Office of the Future": student personal account for a fictional
"Demo University". Competition concept, NOT an official service.
Core: login+profile, schedule, grades/credits, requests/certificates (+status), notifications.

## Stack
PostgreSQL + Prisma | Node 20 + TypeScript (strict) + Fastify + zod | React + Vite + Tailwind PWA | Vitest, supertest, Playwright, k6 | Docker Compose

## Source of truth
/contract/openapi.yaml and /contract/seed-spec.md. Never change them silently.
If a change is needed: edit the contract, log it in docs/process-log.md, then update code.

## Scope rules
- Work ONLY in your own folder (/database, /backend, /frontend, /e2e, /docs).
- Do not edit other agents' folders except the Integrator.

## Security (non-negotiable)
1. Passwords: argon2id hash only. Never log or return hashes or passwords.
2. Ownership: every student-owned query filters by the authenticated student id. Foreign IDs return 404.
3. Roles checked server-side on every staff route.
4. Auth: JWT in httpOnly + Secure + SameSite=Lax cookie. No tokens in localStorage.
5. No secrets in code, repo, or frontend bundle. Only .env (gitignored); keep .env.example.
6. AI API keys server-side only; prompts contain only the current user's data.
7. Validate all input (zod). Rate-limit login. helmet. Strict CORS. No stack traces to clients.
8. Fictional data only: no real names, grades, student IDs. No real university logo or credentials.
9. Open-source libs/fonts/icons with permissive licenses only (MIT, Apache, OFL).

## Quality rules
- TypeScript strict, no `any` without comment. ESLint + Prettier.
- Every feature has tests. Do not mark done with failing tests.
- Mobile first: all flows work at 360px. 44px touch targets. WCAG AA.
- Footer on every page: "Competition concept, not an official university service. Fictional data."
- Original logo only.

## Process logging (judges score this)
After every task append to docs/process-log.md: date, agent, goal, prompt used,
result, AI mistakes found, how fixed, manual steps by human. Save screenshots in docs/screens/.

## Definition of done
Builds, tests pass, README updated, log updated, no secrets (`grep -ri "secret\|password" ` review), committed.
