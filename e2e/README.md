# End-to-End, Accessibility, Security & Load Testing (`/e2e`)

Playwright E2E test suites, `@axe-core/playwright` WCAG AA accessibility audits, IDOR/RBAC security verification, and 100-VU load smoke benchmarks for **Digital Dean's Office of the Future (DemoTech University)**.

> *Competition concept, not an official university service. Fictional data.*

---

## 1. Test Suites (`tests/`)

- **`portal.spec.ts`:** Core user journeys across Desktop (`1280×800`) and Mobile (`360×740`) viewports — SSO login, Today dashboard, schedule changes, grades, request creation, notifications, Digital Student ID, and mandatory competition footer.
- **`workflows.spec.ts`:** Multi-actor workflows verifying student request submission, staff status updates, schedule modifications, and notification delivery.
- **`operational-full-check.spec.ts`:** Complete 4-account operational verification (`aigul.nurova@demo.edu`, `timur.belov@demo.edu`, `lina.okafor@demo.edu`, `dean.office@demo.edu`) across both desktop and 360px mobile viewports.
- **`accessibility-mobile.spec.ts`:** Automated `@axe-core/playwright` WCAG 2.1 AA contrast and ARIA checks, $\ge 44\text{ px}$ touch target verification, and zero horizontal overflow at `360px`.
- **`security-audit.spec.ts`:** Verifies `httpOnly` cookie attributes, zero tokens in `localStorage`, zero secrets in production JS bundles, `401` on unauthenticated calls, `403` on student access to `/api/v1/staff/*`, and `404` on cross-student IDOR attempts.

---

## 2. Commands

```bash
# Install dependencies
npm install

# Run full Playwright E2E suite (auto-starts scripts/local-stack.mjs with embedded PostgreSQL)
npm run test:e2e

# Run desktop or mobile project individually
npm run test:e2e:desktop
npm run test:e2e:mobile

# Run 100-VU Node.js load smoke benchmark
npm run test:load

# Optional k6 load smoke test (requires k6 CLI installed)
k6 run k6-smoke.js
```
