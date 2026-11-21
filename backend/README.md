# Backend API (`/backend`)

Fastify v5 REST API server for **Digital Dean's Office of the Future (DemoTech University)**, built with Node.js 20+, TypeScript (strict), Prisma ORM, Zod v4, and Argon2id.

> *Competition concept, not an official university service. Fictional data.*

---

## 1. Security & Architecture Highlights

- **Password Security:** `argon2id` hashing (`memoryCost: 65536`, `timeCost: 3`, `parallelism: 4`) with constant-time dummy-hash verification on unknown emails to prevent user enumeration (`src/lib/password.ts`).
- **Session Transport:** Signed JWT stored exclusively in `httpOnly`, `Secure` (in production), `SameSite=Lax` cookie `dean_session` (`src/routes/auth.ts`, `src/middleware/auth.ts`). No tokens in `localStorage`.
- **Strict Ownership & IDOR Prevention:** Every student query filters strictly by `req.user.sub` from the verified session cookie. Requests for foreign request or notification UUIDs return `404 Not Found` (never `403`), preventing resource enumeration.
- **Role-Based Access Control (RBAC):** All `/api/v1/staff/*` routes verify `role === 'staff'` server-side and return `403 Forbidden` for students.
- **Hardened HTTP Delivery:** `@fastify/helmet`, strict origin CORS, login rate limiting (`@fastify/rate-limit`), `@fastify/compress` (Brotli/Gzip with 1 KB threshold, auto-delegated on Vercel Edge), central error handler without stack traces, and `Cache-Control: private, no-store` on all authenticated routes.
- **Scoped Academic Copilot (`POST /api/v1/assistant/ask`):** Server-side deterministic rules engine with optional OpenAI-compatible LLM integration (`AI_API_KEY` server-side only). Prompts include only the authenticated user's own academic context.

---

## 2. Environment Setup

Copy [`.env.example`](./.env.example) to `.env`:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Minimum 32-character secret for signing JWTs
- `COOKIE_SECRET` — Minimum 32-character secret for signing cookies
- `CORS_ORIGIN` — Allowed frontend origin (e.g., `http://localhost:5173`)
- `PORT` / `HOST` — Defaults to `3000` / `0.0.0.0`
- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` — Optional server-side LLM configuration

---

## 3. Commands

```bash
# Install dependencies & generate Prisma Client
npm install

# Start development server
npm run dev

# TypeScript check & production build (dist/)
npm run typecheck
npm run build:tsc

# Start production server
npm start

# Run integration, IDOR, RBAC, and performance header tests
npm test
npm run test:coverage

# Lint & format check
npm run lint
npm run format:check
```
