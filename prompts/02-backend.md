# Agent 2: Backend
```
Read /AGENTS.md, /contract/openapi.yaml and the Prisma schema in /database. Work ONLY in /backend.
Implement the API EXACTLY per the contract: Node 20, TypeScript strict, Fastify, zod, Prisma, argon2.
Must have:
- Auth: login verifies argon2 hash, issues JWT in httpOnly+Secure+SameSite=Lax cookie "dean_session",
  short expiry, logout clears it. Constant-time-ish failure (same error for unknown email/wrong password).
- Rate limit on login (429), helmet, strict CORS from env, zod validation, central error handler
  returning {code,message}, no stack traces, structured logs without secrets.
- OWNERSHIP: all student data queries filter by session user id. Foreign request/notification ids return 404.
  Staff routes require role=staff (403 otherwise).
- Request workflow: valid transitions only (submitted->in_review->needs_info<->in_review->ready|rejected;
  cancel only from submitted/in_review). Each change writes status history and a notification.
- Staff schedule change and announcement create notifications for the affected group.
- Optional /assistant/ask: key from env only; the prompt contains ONLY the caller's own data; length limits;
  disabled gracefully if no key.
- GET /health. Dockerfile (multi-stage, non-root). .env.example kept in sync.
Tests (Vitest + supertest), target >85% coverage on routes:
auth ok/fail/rate limit; for EVERY resource an IDOR test (student A cannot read or modify student B);
role tests; validation; workflow transitions; notifications generated; pagination.
Deliver: running API, tests, README, coverage report. Log work and AI mistakes in /docs/process-log.md.
```
