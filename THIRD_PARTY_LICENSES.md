# Third-Party Open-Source Licenses & Attribution

**Project:** Digital Dean's Office of the Future (DemoTech University — Competition Concept)  
**Project License:** MIT (`LICENSE`)  
**Compliance Statement:** All third-party libraries, fonts, icons, and runtime tools used in this prototype are distributed under permissive open-source licenses (`MIT`, `ISC`, `Apache-2.0`, `OFL-1.1`, `BSD-2-Clause`, `PostgreSQL License`) that explicitly permit free use, modification, and distribution.

---

## 1. Visual Assets, Branding & Typography

| Asset / Package | Category | License | Source / Notes |
|---|---|---|---|
| **DemoTech University Emblem & UI Graphics** | Vector SVG Logo (`UniversityEmblem.tsx`, `favicon.svg`) | **MIT (Original Work)** | Custom-authored original geometric SVG emblem created specifically for the fictional DemoTech University concept. Zero official university logos or protected trademarks are used. |
| **Inter (`@fontsource/inter`)** | Self-Hosted Web Font (Cyrillic & Latin `.woff2` subsets) | **SIL Open Font License 1.1 (OFL-1.1)** | Designed by Rasmus Andersson. Self-hosted locally (`frontend/src/fonts.css`) with zero external Google Fonts CDN calls. |
| **Lucide Icons (`lucide-react`)** | Vector UI Icon Library | **ISC / MIT** | Clean open-source feather-derived SVG icons. |

---

## 2. Frontend Dependencies (`frontend/package.json`)

| Package | Version | License | Purpose |
|---|---|---|---|
| `react` / `react-dom` | `^19.3.1` | MIT | Core UI component rendering & state management |
| `@fontsource/inter` | `^5.3.0` | OFL-1.1 / MIT | Self-hosted Inter Cyrillic & Latin WOFF2 font subsets |
| `lucide-react` | `^1.73.0` | ISC | Accessible vector UI icons |
| `qrcode` | `^1.5.4` | MIT | Client-side dynamic QR generation for Digital Student ID |
| `vite` / `@vitejs/plugin-react` | `^8.3.6` / `^6.1.2` | MIT | Frontend bundler & Rolldown code-splitting engine |
| `tailwindcss` / `@tailwindcss/vite` | `^4.3.5` | MIT | Utility-first CSS framework |
| `vitest` / `@testing-library/react` / `jsdom` | `^5.1.0` / `^16.3.3` | MIT | Component & localization unit testing |
| `oxlint` / `eslint` / `typescript` / `prettier` | `^1.90.0` / `^10.15.0` / `^5.9.3` | MIT / Apache-2.0 | Static analysis, strict typechecking, and code formatting |

---

## 3. Backend & Database Dependencies (`backend/package.json`, `database/package.json`)

| Package | Version | License | Purpose |
|---|---|---|---|
| `fastify` | `^5.12.8` | MIT | High-performance HTTP REST API server |
| `@fastify/cookie` | `^11.1.5` | MIT | `httpOnly`, `Secure`, `SameSite=Lax` cookie parsing & signing |
| `@fastify/cors` | `^11.4.3` | MIT | Strict origin-locked Cross-Origin Resource Sharing |
| `@fastify/helmet` | `^13.2.0` | MIT | HTTP security headers & Content-Security-Policy (CSP) |
| `@fastify/rate-limit` | `^11.2.2` | MIT | Brute-force protection on `/api/v1/auth/login` |
| `@fastify/compress` | `^9.3.0` | MIT | Brotli (`br`) and Gzip (`gzip`) response compression |
| `@prisma/client` / `prisma` | `^6.19.3` | Apache-2.0 | Type-safe PostgreSQL ORM, schema migrations, and seeding |
| `argon2` | `^0.45.2` | MIT | Password hashing (`argon2id`, 64 MB memory cost, 3 iterations) |
| `jsonwebtoken` | `^9.0.3` | MIT | Stateless session JWT signing and verification |
| `zod` | `^4.6.7` | MIT | Strict runtime request payload & query validation |
| `dotenv` | `^18.0.10` | BSD-2-Clause | Environment configuration loader |
| `supertest` / `vitest` | `^7.3.2` / `^5.1.0` | MIT | HTTP integration, RBAC, and IDOR security test suites |
| `tsx` / `ts-node` | `^4.23.15` / `^10.9.2` | MIT | TypeScript execution for database seeding & local dev |

---

## 4. End-to-End QA & Infrastructure (`e2e/package.json`, `docker-compose.yml`)

| Package / Image | Version | License | Purpose |
|---|---|---|---|
| `@playwright/test` | `^1.56.0` | Apache-2.0 | Multi-device E2E testing (`1280×800` Desktop & `360×740` Mobile) |
| `@axe-core/playwright` | `^4.10.2` | MPL-2.0 / MIT | Automated WCAG 2.1 AA accessibility & contrast verification |
| `embedded-postgres` | `^18.6.0-beta.19` | MIT / PostgreSQL | Zero-Docker local PostgreSQL instance for automated E2E stack |
| `postgres:16-alpine` | `16` | PostgreSQL License | Relational database container |
| `caddy:2-alpine` | `2` | Apache-2.0 | Automatic HTTPS reverse proxy |
| `nginxinc/nginx-unprivileged` | `1.27-alpine` | BSD-2-Clause | Non-root static PWA asset server |
