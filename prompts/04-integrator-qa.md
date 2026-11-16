# Agent 4: Integrator and QA
```
Read everything (/AGENTS.md, /contract, /database, /backend, /frontend). Work in /e2e and fix integration issues.
1. Run db + api + web with the root docker-compose.yml and Caddyfile; remove frontend mocks; compare real
   responses with /contract/openapi.yaml (use a contract-validation tool such as Schemathesis or
   openapi-response-validator). Fix the side that deviates; log each fix.
2. Playwright E2E, projects: desktop 1280px AND mobile 360x740:
   login ok/fail/logout; Today; schedule day/week + change badges; grades; create each request type;
   staff changes status -> student sees timeline + notification; mark notifications read; empty states
   for Lina; Timur sees failed subject and needs_info request.
3. Security E2E: student A requests student B's request/notification ids -> 404; unauthenticated -> 401;
   student calling /staff/* -> 403; password hashes are argon2 in DB; cookie flags httpOnly/Secure/SameSite;
   no secrets in repo or built bundle (grep for keys, .env, JWT_SECRET); no stack traces on errors.
4. k6 smoke load (100 virtual users, 1 min) with p95 latency report.
5. Accessibility: axe checks on main pages.
6. Write /docs/test-report.md (pass/fail table, fixes made). Fix everything failing, rerun until green.
Never weaken a test to make it pass; fix the code.
```
