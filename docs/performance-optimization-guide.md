# Performance Engineering & Skills Guide

**Project:** Digital Dean's Office of the Future (DemoTech University)  
**Stack:** React 19 + Vite 8 (Rolldown) + Tailwind CSS v4 PWA | Fastify v5 + TypeScript + Prisma v6 + PostgreSQL | Vercel + Docker (Caddy + Nginx)  
**Last Updated:** 2026-11-21

This guide documents the five core performance engineering disciplines, concrete diagnostic tools, repository-specific `npm` commands, interpretation thresholds, and regression-prevention workflows used to keep the portal fast across desktop and throttled mobile connections.

---

## Quick Reference: Repository Performance Commands

All commands run from the repository root (`dean-office/`):

| Task | Command |
|---|---|
| Frontend production build & chunk sizes | `npm --prefix frontend run build` |
| Frontend TypeScript + ESLint + Oxlint | `npm --prefix frontend run typecheck && npm --prefix frontend run lint` |
| Frontend unit/component tests | `npm --prefix frontend test` |
| Backend production build (`dist/`) | `npm --prefix backend run build:tsc` |
| Backend TypeScript + ESLint + tests | `npm --prefix backend run typecheck && npm --prefix backend run lint && npm --prefix backend test` |
| Start full local production stack (PG + Fastify + Vite preview) | `node scripts/local-stack.mjs` |
| Run Web Vitals lab capture (Desktop + Slow 4G Mobile) | `node scripts/measure-web-vitals.mjs` |
| Run 100-VU API load smoke benchmark (against live backend) | `BASE_URL=http://127.0.0.1:3000 node e2e/load-smoke.mjs` |
| Run Playwright E2E non-regression suite (Desktop + Mobile) | `npm --prefix e2e run test:e2e` |
| Run Lighthouse audit (Mobile & Desktop) | `npx --yes lighthouse http://127.0.0.1:4176/ --chrome-flags="--headless --no-sandbox"` |
| Inspect raw / gzip / Brotli bundle sizes | `node -e "const fs=require('fs'),z=require('zlib'),p=require('path');for(const f of fs.readdirSync('frontend/dist/assets').filter(x=>/\.(js\|css)$/.test(x)).sort()){const b=fs.readFileSync(p.join('frontend/dist/assets',f));console.log(f.padEnd(42),(b.length/1e3).toFixed(2)+' KB raw',(z.gzipSync(b,{level:9}).length/1e3).toFixed(2)+' KB gz',(z.brotliCompressSync(b).length/1e3).toFixed(2)+' KB br')}"` |

---

## Agent Skills & Subagents Mapping

Within the Antigravity engineering environment, the following skills and subagents directly support each optimization discipline:

| Skill / Subagent | Discipline | Best Use Case in This Repository |
|---|---|---|
| `react-best-practices` | React & Frontend | Eliminating client-side waterfalls, optimizing bundle splitting, preventing wasted re-renders, and auditing hook dependencies. |
| `performance-optimizer` *(Subagent)* | Full-Stack Web Vitals | Auditing Core Web Vitals (LCP, INP, CLS, TTFB), font loading, edge caching, and bundle size regressions. |
| `cdn-caching` | Edge & Delivery | Verifying `Cache-Control` headers, immutable hashed asset policies, CDN pass-through, and stale-while-revalidate safety. |
| `fixing-motion-performance` | Rendering & Motion | Auditing CSS transitions/animations for layout thrashing, non-composited properties, and CLS risks. |
| `responsive-design` | Mobile Layout & A11y | Ensuring 360px mobile layouts, 44px WCAG touch targets, and reserved container heights to keep CLS $\le 0.1$. |

---

## 1. React Performance Engineering

### 1.1 React DevTools Profiler
- **What it does:** Records component commit phases, render durations, flamegraphs, ranked render times, and exact reasons why each component re-rendered (props change, state change, context change, or parent re-render).
- **When to use it:** Whenever a tab switch, filter input, modal toggle, or schedule update feels sluggish, or when lab profiling shows high Total Blocking Time (TBT) or Interaction to Next Paint (INP $> 200$ ms).
- **How to run it in this repository:**
  1. Start the backend and frontend dev server (`npm --prefix backend run dev` and `npm --prefix frontend run dev`).
  2. Open `http://localhost:5173` in Chrome/Edge with the **React Developer Tools** extension installed.
  3. Open DevTools -> **Profiler** tab -> enable *"Record why each component rendered while profiling"* in settings -> click **Record**, interact with the route (e.g., switch tabs, filter `StaffStudentsPage`, toggle theme), and click **Stop**.
- **How to interpret results:**
  - Gray bars: components that did **not** render during the commit.
  - Yellow/orange/red bars: slow commits (> 16 ms frame budget).
  - Watch for "cascading context renders": if toggling a single piece of state in `AuthContext` re-renders the entire tree, check that the provider value object is wrapped in `useMemo` and callbacks in `useCallback`.
- **Preventing regressions:**
  - Keep `AuthContext` (`frontend/src/context/AuthContext.tsx`) value memoized.
  - Only add `React.memo`, `useMemo`, or `useCallback` where profiling confirms repeated expensive computations (such as grouping weekly classes in `SchedulePage.tsx`, filtering student rosters in `StaffStudentsPage.tsx`, or computing daily schedules in `TodayPage.tsx`).

### 1.2 Lazy Loading & Rendering Optimization (`React.lazy` + `Suspense`)
- **What it does:** Defers downloading, parsing, and evaluating JavaScript for routes and heavy interactive modals until the user actually navigates to or opens them.
- **When to use it:** For every route beyond the entry shell, any authenticated-only layout/chrome when viewing the public login page, and heavy modals/widgets (QR generators, interactive maps, certificate previews, dossier viewers).
- **How it is implemented in this repository:**
  - `frontend/src/App.tsx` lazy-loads `LoginPage` and `AuthenticatedShell` separately so unauthenticated visitors never download `Header`, `Sidebar`, `BottomNav`, or any authenticated route.
  - `frontend/src/components/AuthenticatedShell.tsx` lazy-loads all 8 authenticated pages (`TodayPage`, `SchedulePage`, `GradesPage`, `RequestsPage`, `NotificationsPage`, `ProfilePage`, `StaffDashboardPage`, `StaffStudentsPage`) and all 4 global modals (`StudentCardModal`, `AssistantModal`, `CertificatePreviewModal`, `CampusMapModal`) behind `<Suspense fallback={<PageSkeleton />}>`.
  - `frontend/src/components/StudentCardModal.tsx` dynamically imports `qrcode` (`import('qrcode')`) inside `useEffect` when opened, keeping `vendor-qr` completely off the initial critical path.
- **How to interpret results:** Run `npm --prefix frontend run build` and verify that each page/modal produces its own chunk file in `frontend/dist/assets/` and that `frontend/dist/index.html` only `<link rel="modulepreload">`s core shell chunks (`rolldown-runtime`, `vendor-react`, `vendor-icons`, `index`).
- **Preventing regressions:**
  - Never add static top-level imports of authenticated pages, modals, or heavy utilities into `App.tsx`, `AuthContext.tsx`, or `LoginPage.tsx`.
  - Keep `<PageSkeleton />` (`frontend/src/components/PageSkeleton.tsx`) sized to match typical page layout geometry so lazy chunk hydration preserves CLS $\le 0.1$.

### 1.3 Large-List Virtualization
- **What it does:** Renders only the visible rows inside a scroll viewport (plus a small overscan buffer) instead of mounting hundreds or thousands of DOM nodes simultaneously.
- **When to use it:** When a table or feed exceeds ~100 rendered DOM rows (e.g., if `StaffStudentsPage` scales from the 15-student competition dataset to 500–5,000 real university students, or if `NotificationsPage` / `RequestsPage` renders long unpaginated histories).
- **How to run / adopt in this repository:**
  - Currently, `/api/v1/requests`, `/api/v1/notifications`, and `/api/v1/staff/requests` already enforce server-side pagination (`page`, `pageSize` defaulting to 20).
  - For future unpaginated rosters > 150 rows, install an MIT-licensed virtualizer (`npm --prefix frontend install @tanstack/react-virtual`) and wrap the scrollable roster container with `useVirtualizer({ count, getScrollElement, estimateSize })`.
- **How to interpret results:** Inspect Chrome DevTools -> **Elements** DOM node count (aim for `< 1,500` total DOM nodes per view) and verify `Recalculate Style` / `Layout` tasks remain `< 16 ms` during scroll.
- **Preventing regressions:** Enforce server-side pagination (`pageSize <= 100`) on all growing collections in Fastify Zod schemas before adding client virtualization.

---

## 2. Vite 8 (Rolldown) Build Optimization

### 2.1 Dynamic Imports
- **What it does:** Standard ES `import('./module')` expressions create automatic Rollup/Rolldown split points, moving non-critical libraries and routes into on-demand chunks.
- **When to use it:** For route components, modal dialogs, PDF/QR/chart generators, and admin-only utilities.
- **How to run / verify in this repository:**
  ```powershell
  npm --prefix frontend run build
  ```
  Verify `vendor-qr-*.js` is NOT listed in `<link rel="modulepreload">` inside `frontend/dist/index.html`.
- **How to interpret results:** Check the Vite build table for isolated chunks (`LoginPage-*.js`, `AuthenticatedShell-*.js`, `SchedulePage-*.js`, `vendor-qr-*.js`) and ensure `index-*.js` stays small (`< 30 KB` raw).
- **Preventing regressions:** Review PR diffs touching `frontend/src/App.tsx`, `frontend/src/components/AuthenticatedShell.tsx`, or `frontend/package.json` for accidental static imports of heavy dependencies.

### 2.2 Code Splitting (`build.rolldownOptions.output.codeSplitting`)
- **What it does:** Groups genuinely shared, slow-changing vendor libraries into dedicated cacheable chunks using Vite 8's native Rolldown `codeSplitting.groups` API (superseding legacy Rollup `manualChunks`).
- **When to use it:** To separate long-lived vendor dependencies (`react`, `react-dom`, `lucide-react`, `qrcode`) from frequently deployed application chunks so returning visitors reuse cached vendor chunks across deploys.
- **How it is configured in this repository (`frontend/vite.config.ts`):**
  ```ts
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom)/ },
            { name: 'vendor-icons', test: /node_modules[\\/]lucide-react/ },
            { name: 'vendor-qr', test: /node_modules[\\/]qrcode/ },
          ],
        },
      },
    },
  }
  ```
- **How to interpret results:** Aim for a balanced chunk graph (15–25 chunks total, no circular chunk warnings, no single application chunk exceeding 60 KB raw, and zero duplicated React instances).
- **Preventing regressions:** Do not copy outdated Rollup `rollupOptions.output.manualChunks` object configs into Vite 8/Rolldown; always use `rolldownOptions.output.codeSplitting.groups` and verify zero Vite config warnings during `npm --prefix frontend run build`.

### 2.3 Bundle Analysis with a Compatible Visualizer
- **What it does:** Generates an interactive treemap/sunburst showing exact module-by-module byte contributions (raw, gzip, Brotli) inside every emitted chunk.
- **When to use it:** Whenever the production build grows unexpectedly, before adding a new npm dependency, or during quarterly performance audits.
- **How to run it in this repository:**
  - **Zero-dependency CLI breakdown (works immediately with Vite 8 / Rolldown):**
    ```powershell
    npm --prefix frontend run build
    node -e "const fs=require('fs'),z=require('zlib'),p=require('path');const d='frontend/dist/assets';let tr=0,tg=0,tb=0;for(const f of fs.readdirSync(d).filter(x=>/\.(js|css)$/.test(x)).sort()){const b=fs.readFileSync(p.join(d,f)),g=z.gzipSync(b,{level:9}),br=z.brotliCompressSync(b);tr+=b.length;tg+=g.length;tb+=br.length;console.log(f.padEnd(42),(b.length/1e3).toFixed(2).padStart(8)+' KB',(g.length/1e3).toFixed(2).padStart(8)+' KB gz',(br.length/1e3).toFixed(2).padStart(8)+' KB br')}console.log('TOTAL'.padEnd(42),(tr/1e3).toFixed(2).padStart(8)+' KB',(tg/1e3).toFixed(2).padStart(8)+' KB gz',(tb/1e3).toFixed(2).padStart(8)+' KB br')"
    ```
  - **Interactive HTML treemap (via `rollup-plugin-visualizer`, MIT licensed):**
    ```powershell
    npm --prefix frontend install -D rollup-plugin-visualizer
    ```
    Add `visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true })` conditionally when `process.env.ANALYZE === 'true'` in `frontend/vite.config.ts`, then run `ANALYZE=true npm --prefix frontend run build` and open `frontend/dist/stats.html` (gitignored).
- **How to interpret results:** Sort modules by **Brotli/Gzip size** rather than raw bytes. Look for duplicated dependencies, unused locales/font subsets, or barrel-file imports pulling entire libraries.
- **Preventing regressions:** Audit `frontend/package.json` on every dependency addition; ensure unused packages (such as previously pruned `@fontsource/montserrat` and `@fontsource/jetbrains-mono`) are removed promptly.

### 2.4 Font & Asset Optimization
- **What it does:** Restricts self-hosted fonts to needed scripts/weights (`cyrillic` + `latin` `.woff2` only in `frontend/src/fonts.css`), adds `<link rel="preload">` for primary above-the-fold fonts in `frontend/index.html`, and uses `font-display: swap` to prevent invisible text (FOIT).
- **When to use it:** Whenever adding fonts, icons, or raster media.
- **How to verify in this repository:**
  ```powershell
  Get-ChildItem frontend\dist\assets\*.woff* | Select-Object Name, Length
  ```
  Confirm only the 8 Inter Cyrillic & Latin `.woff2` files (400/500/600/700) are emitted and zero legacy `.woff`, Greek, or Vietnamese subsets exist.
- **Preventing regressions:** Never import full `@fontsource/*/{weight}.css` bundles in `main.tsx`; declare explicit `.woff2`-only `@font-face` rules with `unicode-range` in `frontend/src/fonts.css`. Convert any future raster photos to WebP/AVIF, specify explicit `width`/`height` attributes, and add `loading="lazy"` to below-the-fold images.

---

## 3. Web Performance Diagnostics

### 3.1 Lighthouse
- **What it does:** Runs an automated synthetic lab audit against a live URL, scoring Performance, Accessibility, Best Practices, and SEO while pinpointing render-blocking resources, unused JS/CSS, and main-thread bottlenecks.
- **When to use it:** Before and after performance work, and as a release gate before production deploys.
- **How to run it in this repository:**
  1. Build both apps: `npm --prefix frontend run build && npm --prefix backend run build:tsc`
  2. Start the local production stack in terminal 1: `node scripts/local-stack.mjs`
  3. Run Lighthouse in terminal 2:
     ```powershell
     # Mobile preset (default)
     npx --yes lighthouse http://127.0.0.1:4176/ --output=json --output-path=docs/lh-mobile.json --chrome-flags="--headless --no-sandbox"

     # Desktop preset
     npx --yes lighthouse http://127.0.0.1:4176/ --preset=desktop --output=json --output-path=docs/lh-desktop.json --chrome-flags="--headless --no-sandbox"
     ```
- **How to interpret results:**
  - **Performance Score:** Target $\ge 90$ (green).
  - **FCP:** $\le 1.8$ s | **LCP:** $\le 2.5$ s | **TBT:** $\le 200$ ms | **CLS:** $\le 0.1$ | **TTFB:** $\le 800$ ms.
  - Note that Lighthouse uses Lantern simulated throttling on localhost; compare identically configured runs and report lab measurements separately from Real User Monitoring (RUM) field data.
- **Preventing regressions:** Track scores per PR with Lighthouse CI assertions (Section 5.1).

### 3.2 PageSpeed Insights (PSI)
- **What it does:** Combines synthetic Lighthouse lab runs with **Chrome User Experience Report (CrUX)** real-user field data (28-day rolling p75 Core Web Vitals) for publicly deployed URLs.
- **When to use it:** After deploying to Vercel production/preview URLs to verify real-world p75 field metrics and CDN compression/caching behavior.
- **How to run it:**
  - Visit `https://pagespeed.web.dev/` and enter the deployed Vercel URL, or query the PSI API:
    ```powershell
    curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://<your-vercel-domain>&strategy=mobile"
    ```
- **How to interpret results:** Always separate the top **"Discover what your real users are experiencing" (Field / CrUX p75)** section from **"Diagnose performance issues" (Lab)**. Never claim field Core Web Vitals improved based solely on local lab measurements.
- **Preventing regressions:** Review CrUX p75 trends monthly after production releases.

### 3.3 Chrome DevTools Performance & Network Panels
- **What it does:** Captures frame-by-frame CPU flamecharts, Long Tasks ($> 50$ ms), layout shifts, script evaluation costs, and full HTTP request waterfalls (DNS, TLS, TTFB, content download, `Content-Encoding`, `Cache-Control`, Service Worker origin).
- **When to use it:** When investigating *why* LCP is delayed, identifying request waterfalls, verifying `br`/`gzip` response compression, or checking that `/assets/*` serves from `(ServiceWorker)` or `(disk cache)` on repeat loads.
- **How to run it in this repository:**
  1. Launch `node scripts/local-stack.mjs` and open `http://127.0.0.1:4176/` in Chrome.
  2. **Network panel:** Check *"Disable cache"* for cold-load audit; select **"Slow 4G"** throttling; reload and inspect columns `Size`, `Time`, `Content-Encoding`, and `Cache-Control`. Uncheck *"Disable cache"* and reload again to confirm instant Service Worker / cache hits.
  3. **Performance panel:** Enable **4× CPU slowdown** + **Slow 4G**, click **Record & Reload**, and inspect the **LCP** marker, **Layout Shifts** track, and **Main** thread long tasks.
- **How to interpret results:**
  - Verify `index.html` returns `Cache-Control: no-cache` and `/assets/*` returns `public, max-age=31536000, immutable`.
  - Verify authenticated `/api/v1/*` calls return `Cache-Control: private, no-store` and `Content-Encoding: br` (or `gzip`) for payloads $\ge 1$ KB.
  - Eliminate any synchronous script task exceeding 50 ms on the main thread during initial load.
- **Preventing regressions:** Inspect the Network waterfall whenever adding a new API call on startup to ensure no sequential request waterfalls are introduced.

### 3.4 Core Web Vitals (`scripts/measure-web-vitals.mjs`)
- **What it does:** Automates Playwright + Chrome DevTools Protocol (CDP) `PerformanceObserver` measurements (`TTFB`, `FCP`, `LCP`, `CLS`, `INP`, `TBT`) across both Desktop (`1280x800`, unthrottled) and Throttled Mobile (`360x740`, 4× CPU slowdown, 1.638 Mbps Slow 4G, 150 ms RTT) across all critical authenticated and public user journeys.
- **When to use it:** After frontend/backend changes to get reproducible cross-route lab metrics (Landing/Login, Student Dashboard, Profile, Schedule, Staff Student Roster).
- **How to run it in this repository:**
  ```powershell
  # With scripts/local-stack.mjs running:
  node scripts/measure-web-vitals.mjs
  ```
- **How to interpret results:**
  - **LCP** $\le 2,500$ ms | **INP** $\le 200$ ms | **CLS** $\le 0.1$ | **TTFB** $\le 800$ ms (p75).
  - Run 3+ iterations when comparing close deltas to account for $\pm 5\text{–}10\%$ synthetic host CPU scheduling variance.
- **Preventing regressions:** Compare `docs/web-vitals-final.json` against `docs/web-vitals-baseline.json` before major releases.

---

## 4. Backend Performance (Fastify + Prisma + Delivery)

### 4.1 Fastify Profiling
- **What it does:** Identifies event-loop stalls, slow serialization, synchronous blocking operations (e.g., cryptographic hashing or heavy loops), and slow middleware/hooks in Fastify v5.
- **When to use it:** When API TTFB exceeds 100 ms locally or p95 latency degrades under load.
- **How to run it in this repository:**
  - **Node.js built-in CPU profiler (zero extra packages):**
    ```powershell
    npm --prefix backend run build:tsc
    node --cpu-prof --cpu-prof-dir=backend/profiles backend/dist/server.js
    ```
    Load the `.cpuprofile` file in Chrome DevTools -> **Performance** panel.
  - **Clinic.js flamegraph (optional on-demand CLI):**
    ```powershell
    npx --yes clinic flame -- node backend/dist/server.js
    ```
  - **Fastify response time logs:** Fastify's Pino logger (`backend/src/createApp.ts`) records `responseTime` (in milliseconds) on every completed request when `LOG_LEVEL=info`.
- **How to interpret results:** Look for wide frames in application route handlers, unparallelized `await` chains in Prisma calls, or synchronous JSON/crypto bottlenecks on the event loop. (Note: `argon2id` runs asynchronously in libuv's threadpool, which is expected on `/auth/login`.)
- **Preventing regressions:** Parallelize independent Prisma queries with `Promise.all` (as done in `GET /api/v1/schedule/today`, `GET /api/v1/requests`, `GET /api/v1/notifications`, and `POST /api/v1/requests`), use explicit `select` projections to avoid transferring `passwordHash` or unused columns, and reuse the singleton `PrismaClient` via `globalThis` (`backend/src/lib/prisma.ts`).

### 4.2 HTTP Response Compression (`@fastify/compress` + Vercel / Caddy / Nginx)
- **What it does:** Compresses text/JSON responses using Brotli (`br`) or Gzip (`gzip`) when Fastify directly owns compression, dramatically reducing transfer size on roster, schedule, and grades endpoints while preventing double compression.
- **When to use it:** On all JSON/text API payloads $\ge 1,024$ bytes served by standalone Node, Docker, or local preview stacks.
- **How it is configured in this repository:**
  - **Fastify (`backend/src/createApp.ts`):** Registers `@fastify/compress` with `threshold: 1024`, `encodings: ['br', 'gzip', 'deflate']`, Brotli quality `4` (fast dynamic JSON compression without TTFB penalty), and Gzip level `6`. Automatically skips compression when `VERCEL=1` because Vercel's Edge CDN already compresses serverless responses at the edge (preventing double compression and redundant serverless CPU overhead).
  - **Nginx (`frontend/nginx.conf`):** Enables `gzip on` (`gzip_min_length 1024`, `gzip_comp_level 6`) for static assets in Docker deployments.
  - **Caddy (`Caddyfile`):** `encode zstd gzip` passes through responses that already carry `Content-Encoding` without double-compressing.
- **How to verify in this repository:**
  ```powershell
  npm --prefix backend test -- tests/performance-headers.test.ts
  ```
- **How to interpret results:** Payloads $\ge 1$ KB (e.g., `/api/v1/staff/students`, `/api/v1/schedule`) should return `Content-Encoding: br` (or `gzip`), `Vary: accept-encoding`, and 60–80% smaller wire sizes. Payloads $< 1$ KB (e.g., `/api/v1/health`) remain uncompressed.
- **Preventing regressions:** Keep `backend/tests/performance-headers.test.ts` in CI to assert compression ratio, threshold behavior, and Vercel delegation.

### 4.3 Cache-Control Configuration
- **What it does:** Instructs browsers, CDNs, and proxies exactly which static assets can be cached forever versus which HTML/API responses must revalidate or never be stored.
- **When to use it:** On every HTTP response across static delivery (`vercel.json`, `frontend/nginx.conf`, `frontend/public/sw.js`) and Fastify API routes (`backend/src/createApp.ts`).
- **Configured policy matrix in this repository:**
  | Resource | Layer | `Cache-Control` Policy | Rationale |
  |---|---|---|---|
  | `/assets/*` (content-hashed JS/CSS/WOFF2) | `vercel.json`, `nginx.conf`, `sw.js` | `public, max-age=31536000, immutable` | Safe 1-year immutable cache; hash changes on every content edit. |
  | `/`, `/index.html`, SPA deep links | `vercel.json`, `nginx.conf`, `sw.js` | `no-cache` (ETag revalidation) | Users always pick up the newest deployment chunk hashes. |
  | `/sw.js` | `vercel.json`, `nginx.conf` | `no-cache, no-store, must-revalidate` | Browser checks for updated service worker immediately. |
  | `/manifest.webmanifest`, `/favicon.svg` | `vercel.json`, `nginx.conf` | `public, max-age=86400` | Low-churn public PWA metadata. |
  | `GET /api/v1/health` | Fastify (`createApp.ts`) | `no-cache, no-store, must-revalidate` | Health probes must always reflect live status. |
  | `GET /api/v1/request-types` | Fastify (`requests.ts`) | `private, max-age=300, stale-while-revalidate=60` | Authenticated static catalog (zero PII); private client-only caching. |
  | All authenticated student/staff APIs & auth routes | Fastify global `onSend` hook | `private, no-store` + `Pragma: no-cache` | Strictly prevents proxy/CDN caching of student PII, grades, or sessions. |
- **How to verify in this repository:** Run `npm --prefix backend test -- tests/performance-headers.test.ts` and inspect live headers via `curl -I http://127.0.0.1:3000/api/v1/health`.
- **Preventing regressions:** Because `backend/src/createApp.ts` applies `private, no-store` in a global `onSend` hook, any new API route is secure by default even if a developer forgets to set a header.

### 4.4 API Latency & Load Analysis (`e2e/load-smoke.mjs`)
- **What it does:** Drives 100 concurrent virtual users (VUs) over 10 seconds against `/api/v1/health`, `/api/v1/schedule`, and `/api/v1/grades`, computing throughput (RPS), error rate, and `p50`/`p95`/`p99`/`max` latencies.
- **When to use it:** After modifying Fastify plugins, Prisma queries, database indexes, or connection pooling.
- **How to run it in this repository:**
  ```powershell
  # Against live local stack (start node scripts/local-stack.mjs first):
  $env:BASE_URL="http://127.0.0.1:3000"; $env:LOAD_P95_MS="1500"; node e2e/load-smoke.mjs

  # Standalone Fastify smoke check (no external DB needed):
  node e2e/load-smoke.mjs
  ```
- **How to interpret results:**
  - `errorRatePct` must always be `0.000%`.
  - Compare `rps`, `p50Ms`, `p95Ms`, and `p99Ms` under identical VU counts and hardware against baseline (`docs/performance-baseline.md`).
- **Preventing regressions:** Run `e2e/load-smoke.mjs` before merging database schema or Prisma query refactors.

---

## 5. Monitoring and Regression Prevention

### 5.1 Lighthouse CI (`@lhci/cli`)
- **What it does:** Automates Lighthouse audits in CI/CD pipelines and fails builds if Performance, Accessibility, LCP, CLS, or TBT regress past configured budgets.
- **When to use it:** In GitHub Actions / pre-merge CI workflows after `npm --prefix frontend run build`.
- **How to run it in this repository:**
  ```powershell
  npx --yes @lhci/cli autorun --collect.url=http://127.0.0.1:4176/ --collect.numberOfRuns=3 --assert.assertions.categories:performance='["error",{"minScore":0.9}]' --assert.assertions.largest-contentful-paint='["error",{"maxNumericValue":2500}]' --assert.assertions.cumulative-layout-shift='["error",{"maxNumericValue":0.1}]'
  ```
- **How to interpret results:** LHCI takes the median of 3 runs to eliminate single-run noise and prints a clear PASS/FAIL assertion table.
- **Preventing regressions:** Store a `.lighthouserc.json` at the repo root and invoke `lhci autorun` on pull requests touching `frontend/`.

### 5.2 Real-User Monitoring with `web-vitals`
- **What it does:** Captures real-world field Core Web Vitals (`onLCP`, `onINP`, `onCLS`, `onFCP`, `onTTFB`) directly from users' actual browsers and devices via Google's tiny (~2 KB) Apache-2.0 `web-vitals` library.
- **When to use it:** Once deployed to real users (or pilot cohorts) so the team monitors genuine p75 field metrics rather than relying solely on synthetic lab estimates.
- **How to integrate in this repository:**
  ```powershell
  npm --prefix frontend install web-vitals
  ```
  Lazily load it after initial paint in `frontend/src/main.tsx` (`import('web-vitals').then(({ onLCP, onINP, onCLS, onFCP, onTTFB }) => ...)`) and beacon aggregated anonymous telemetry (never including PII or student IDs) via `navigator.sendBeacon` or Vercel Speed Insights (`@vercel/speed-insights`).
- **How to interpret results:** Track the **75th percentile (p75)** per route and device class:
  - Good: LCP $\le 2.5$ s, INP $\le 200$ ms, CLS $\le 0.1$, TTFB $\le 800$ ms.
- **Preventing regressions:** Set alerts when weekly p75 moves from "Good" into "Needs Improvement" on mobile.

### 5.3 Performance Budgets
- **What it does:** Establishes hard upper bounds on JavaScript/CSS payloads, font counts, and latency metrics so gradual feature creep never silently re-introduces monolithic bundles.
- **Recommended budgets for Digital Dean's Office:**
  | Budget Category | Enforced Ceiling | Rationale |
  |---|---|---|
  | Public `/login` initial JS (raw) | $\le 300$ KB raw ($\le 95$ KB gzip / $\le 80$ KB Brotli) | Ensures fast Slow 4G mobile first load |
  | Core entry app chunk (`index-*.js`) | $\le 30$ KB raw ($\le 10$ KB gzip) | Keeps entry router & auth shell lean |
  | Initial CSS (`index-*.css`) | $\le 90$ KB raw ($\le 16$ KB gzip) | Fast render-blocking stylesheet parse |
  | Emitted font files (`dist/assets/*.woff2`) | $\le 8$ files (Cyrillic + Latin WOFF2 only) | Prevents unused script bloat |
  | Mobile Lab LCP (Landing/Login) | $\le 2,500$ ms | Core Web Vitals Good threshold |
  | Desktop & Mobile CLS (all routes) | $\le 0.100$ | Eliminates jarring layout shifts |
  | API compressed payload savings ($\ge 1$ KB) | $\ge 50\%$ reduction via `br` / `gzip` | Verifies active response compression |
  | Authenticated API `Cache-Control` | `private, no-store` (0 `public` routes) | Non-negotiable student data protection |
- **How to run an automated budget check:** Run the bundle sizing script in Quick Reference or add a budget assertion step in CI after `npm --prefix frontend run build`.

### 5.4 Automated Production Smoke Tests & Non-Regression Suite
- **What it does:** Verifies end-to-end authentication, RBAC, IDOR boundaries, PWA offline behavior, dark mode, 360px mobile usability, security headers, and zero console/network errors across Chromium Desktop & Mobile viewports.
- **When to use it:** Before every commit, release, or performance optimization PR.
- **How to run the complete verification matrix in this repository:**
  ```powershell
  # 1. Static analysis & production builds
  npm --prefix frontend run typecheck
  npm --prefix frontend run lint
  npm --prefix frontend run build
  npm --prefix backend run typecheck
  npm --prefix backend run build:tsc
  npm --prefix backend run lint

  # 2. Unit & API integration tests (including compression & Cache-Control tests)
  npm --prefix frontend test
  npm --prefix backend test

  # 3. Full E2E & load verification (against scripts/local-stack.mjs)
  npm --prefix e2e run test:e2e
  $env:BASE_URL="http://127.0.0.1:3000"; node e2e/load-smoke.mjs
  ```
- **How to interpret results:** Every check must exit with code `0`, zero failed tests, zero TypeScript/ESLint errors, zero leaked secrets in `frontend/dist/`, and zero unexpected browser console errors.
- **Preventing regressions:** Never mark a performance optimization complete until both the performance telemetry AND the full non-regression test matrix pass cleanly.
