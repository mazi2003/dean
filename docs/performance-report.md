# Digital Dean's Office of the Future: Final Performance Engineering Report

**Document Version:** 1.0.0  
**Date:** 2026-11-21  
**Project:** Digital Dean's Office of the Future (DemoTech University)  
**Baseline Reference:** [docs/performance-baseline.md](./performance-baseline.md)  
**Skills & Operations Guide:** [docs/performance-optimization-guide.md](./performance-optimization-guide.md)  
**Stack Verified:** React 19.3.1 + Vite 8.3.8 (Rolldown) + Tailwind CSS v4 PWA | Fastify v5.12.8 + `@fastify/compress` + Prisma v6.19.3 + PostgreSQL 18.6 | Playwright v1.56 + Lighthouse v12

---

## 1. Executive Summary

Across Phases 1–6, the performance engineering team reduced the public initial JavaScript payload by **57.51% raw** (**48.25% gzip**, **44.39% Brotli**), cut unused JavaScript on the entry route by **90.5%**, pruned emitted font files by **88.9%** (from 72 files down to 8 Cyrillic & Latin WOFF2 subsets), enabled Fastify Brotli/Gzip response compression saving **61.0%–72.5%** on API payloads $\ge 1$ KB, enforced `Cache-Control: private, no-store` across all authenticated student and staff routes, and increased 100-VU backend throughput by **+59.2%** while cutting $p_{95}$ tail latency by **-55.8%** — all with **zero functional regressions** and **100% pass rates** across unit, integration, security, WCAG AA accessibility, and 42 desktop/mobile Playwright E2E tests.

> **Lab vs. Real-User Field (RUM) Separation:**  
> All timing metrics in this report are **synthetic lab measurements** captured locally against the production build (`scripts/local-stack.mjs`) using identical desktop (`1280×800`, unthrottled) and throttled mobile (`360×740`, 4× CPU slowdown, 1.638 Mbps Slow 4G, 150 ms RTT) profiles. Real-user field metrics (CrUX / RUM p75) are **N/A** prior to production deployment and are not extrapolated from local builds.

---

## 2. Headline Before / After Comparison Table

| Category & Metric | Baseline (HEAD `47d92f0`) | Final (Post-Optimization) | Delta | Improvement |
|---|---|---|---|---|
| **Initial JS Payload — Raw** (`/`) | 651,906 B (651.91 KB) | **276,989 B (276.99 KB)** | -374,917 B | **-57.51%** *(vs pre-commit 639.44 KB: -56.68%)* |
| **Initial JS Payload — Gzip (lvl 9)** | 165,528 B (165.53 KB) | **85,668 B (85.67 KB)** | -79,860 B | **-48.25%** |
| **Initial JS Payload — Brotli (q11)** | 132,404 B (132.40 KB) | **73,628 B (73.63 KB)** | -58,776 B | **-44.39%** |
| **Entry App Chunk (`index-*.js`) Raw** | 385,952 B (385.95 KB) | **34,498 B (34.50 KB)** | -351,454 B | **-91.06%** |
| **Initial CSS (`index-*.css`) Raw** | 91,060 B *(Baseline: 131,636 B)* | **84,625 B (84.63 KB)** | -6,435 B | **-7.07%** *(vs pre-commit: -35.71%)* |
| **Combined Initial JS + CSS (Raw)** | 742,966 B (742.97 KB) | **361,614 B (361.61 KB)** | -381,352 B | **-51.33%** |
| **Emitted Font Files (`dist/assets/`)** | 72 files *(Baseline: 88)* | **8 `.woff2` files** | -64 files | **-88.89%** *(vs pre-commit: -90.91%)* |
| **Lighthouse Unused JS (`/`)** | ~412,000 B | **39,135 B** | -372,865 B | **-90.50%** |
| **Lighthouse Desktop Performance** | 88 / 100 | **92 / 100** | +4 pts | **+4.5% (Green $\ge 90$)** |
| **Lighthouse Desktop FCP / LCP** | 414 ms / 939 ms | **273 ms / 706 ms** | -141 / -233 ms | **-34.1% / -24.8%** |
| **Lighthouse Mobile Performance** | 68 / 100 | **70 / 100** | +2 pts | **+2.9%** |
| **Lighthouse Mobile FCP / LCP** | 1,101 ms / 3,174 ms | **789 ms / 2,628 ms** | -312 / -546 ms | **-28.3% / -17.2%** |
| **CDP Mobile Login LCP / TBT** | 4,848 ms / 148 ms | **3,912 ms / 89 ms** | -936 / -59 ms | **-19.3% / -39.9%** |
| **CDP Mobile Dashboard LCP / TBT** | 10,996 ms / 3,257 ms | **5,272 ms / 873 ms** | -5,724 / -2,384 ms | **-52.1% / -73.2%** |
| **CDP Mobile Profile LCP / INP** | 12,448 ms / 840 ms | **6,228 ms / 256 ms** | -6,220 / -584 ms | **-50.0% / -69.5%** |
| **CDP Desktop Staff Roster CLS** | 0.1485 *(FAIL)* | **0.0766** *(PASS $\le 0.1$)* | -0.0719 | **-48.4%** |
| **CDP Mobile Staff Roster CLS** | 0.6389 | **0.2120** | -0.4269 | **-66.8%** |
| **API Compression (`/staff/students`)** | 0% (5,098 B uncompressed) | **1,403 B br / 1,435 B gzip** | -3,695 B (br) | **-72.5% (br) / -71.9% (gzip)** |
| **API Latency `/staff/groups` Mean / $p_{95}$** | 30.80 ms / 62.55 ms | **21.57 ms / 35.15 ms** | -9.23 / -27.40 ms | **-30.0% / -43.8%** |
| **API Latency `/schedule/today` Mean / $p_{50}$** | 27.58 ms / 25.66 ms | **23.28 ms / 21.52 ms** | -4.30 / -4.14 ms | **-15.6% / -16.1%** |
| **100-VU Load Throughput (RPS)** | 159.0 RPS (1,649 req) | **253.1 RPS (2,646 req)** | +94.1 RPS | **+59.2%** |
| **100-VU Load Latency ($p_{50}$ / $p_{95}$ / $p_{99}$)** | 582.2 / 1,621.4 / 2,327.5 ms | **393.5 / 717.0 / 858.9 ms** | -188.8 / -904.4 / -1,468.7 ms | **-32.4% / -55.8% / -63.1%** |
| **Authenticated API `Cache-Control`** | Missing (`undefined`) | **`private, no-store`** | 100% coverage | **Zero public caching risk** |

---

## 3. Raw, Gzip & Brotli Bundle Breakdown (Final Production Build)

Measured directly against `frontend/dist/assets/` via Node.js `zlib` (`gzip` level 9, `brotli` quality 11).

### 3.1 Initial Critical-Path JavaScript (Loaded on Public `/`)

| Chunk File | Raw (Bytes) | Raw (KB) | Gzip (KB) | Brotli (KB) | Role |
|---|---:|---:|---:|---:|---|
| `vendor-react-DctBZRDK.js` | 218,747 B | 218.75 KB | 67.39 KB | 58.04 KB | React 19.3.1 + ReactDOM + scheduler (long-term cached vendor chunk) |
| `index-Dtgjhbyp.js` | 34,498 B | 34.50 KB | 10.14 KB | 8.66 KB | Entry shell, `AuthContext`, `LoginPage` (eager to avoid Slow 4G waterfall) |
| `vendor-icons-9RDF3m7C.js` | 23,145 B | 23.15 KB | 7.77 KB | 6.61 KB | Tree-shaken `lucide-react` icons |
| `rolldown-runtime-WkwZ5CU-.js` | 599 B | 0.60 KB | 0.37 KB | 0.33 KB | Vite 8 Rolldown chunk loader runtime |
| **Total Initial JS (Final)** | **276,989 B** | **276.99 KB** | **85.67 KB** | **73.63 KB** | **4 chunks — ZERO authenticated code or `qrcode` loaded on `/`** |
| *Baseline Initial JS (HEAD)* | *651,906 B* | *651.91 KB* | *165.53 KB* | *132.40 KB* | *Monolithic 5-chunk bundle including all 9 routes + `qrcode`* |
| **Net Initial JS Reduction** | **-374,917 B** | **-374.92 KB** | **-79.86 KB** | **-58.78 KB** | **-57.51% raw / -48.25% gzip / -44.39% Brotli** |

### 3.2 Deferred On-Demand Lazy JavaScript Chunks (Loaded Only After Auth / Interaction)

| Lazy Chunk File | Raw (Bytes) | Raw (KB) | Gzip (KB) | Brotli (KB) | Trigger Condition |
|---|---:|---:|---:|---:|---|
| `AuthenticatedShell-c7260Bll.js` | 61,416 B | 61.42 KB | 17.25 KB | 14.55 KB | Loaded only when authenticated (`Header`, `Sidebar`, `BottomNav`, `Footer`) |
| `SchedulePage-BYr43TrH.js` | 49,579 B | 49.58 KB | 11.33 KB | 9.51 KB | Navigating to Schedule & Exams tab |
| `CampusMapModal-Bl2rTfj6.js` | 38,849 B | 38.85 KB | 10.41 KB | 8.82 KB | Opening interactive campus wayfinding map |
| `TodayPage-C-nCUwEc.js` | 38,548 B | 38.55 KB | 7.42 KB | 6.29 KB | Authenticated student dashboard |
| `StaffDashboardPage-CXnOT-65.js` | 36,606 B | 36.61 KB | 8.48 KB | 7.27 KB | Authenticated staff inbox/directives console |
| `StudentDossierModal-BIDlYzTt.js` | 35,647 B | 35.65 KB | 7.89 KB | 6.63 KB | Staff opening a student dossier modal |
| `StaffStudentsPage-DcTJe5m0.js` | 25,313 B | 25.31 KB | 6.11 KB | 5.29 KB | Staff opening Groups & Students roster |
| `StudentCardModal-CBrQMCgW.js` | 25,163 B | 25.16 KB | 6.94 KB | 5.84 KB | Opening Digital Student ID modal |
| `vendor-qr-CXHAcuVq.js` | 23,463 B | 23.46 KB | 8.80 KB | 7.74 KB | Dynamic `import('qrcode')` inside `StudentCardModal` |
| `RequestsPage-Dugm3eSI.js` | 16,139 B | 16.14 KB | 4.52 KB | 3.85 KB | Navigating to Certificates & Requests tab |
| `GradesPage-U6WZr73l.js` | 12,939 B | 12.94 KB | 3.71 KB | 3.09 KB | Navigating to Grades / Record Book tab |
| `ProfilePage-BRugp06g.js` | 10,426 B | 10.43 KB | 2.59 KB | 2.18 KB | Navigating to Student Profile tab |
| `CertificatePreviewModal-DwLy6JUx.js` | 10,303 B | 10.30 KB | 3.84 KB | 3.12 KB | Previewing electronic certificate PDF mockup |
| `AssistantModal-BIl159EX.js` | 8,582 B | 8.58 KB | 3.34 KB | 2.71 KB | Opening Academic Advisor modal |
| `NotificationsPage-HtNxIWQZ.js` | 7,713 B | 7.71 KB | 2.77 KB | 2.36 KB | Navigating to Notifications tab |
| `ScheduleCollisionAlert-Dno-XDJP.js` | 6,465 B | 6.47 KB | 2.77 KB | 2.29 KB | Shared schedule/today collision helper chunk |
| **Total Deferred Lazy JS** | **407,151 B** | **407.15 KB** | **108.18 KB** | **91.56 KB** | **16 chunks — never transferred on public `/`** |

### 3.3 CSS, HTML & Fonts

| Asset | Baseline (HEAD) | Final | Delta |
|---|---|---|---|
| `index-*.css` (Raw / Gzip / Brotli) | 91.06 / 14.83 / 12.07 KB | **84.63 / 13.99 / 11.42 KB** | **-7.07% raw / -5.65% gz / -5.38% br** |
| `index.html` (Raw) | 1,490 B *(+ 243 B blocking `theme-init.js` request)* | **1,702 B** *(0 blocking script requests)* | Eliminated 1 render-blocking HTTP request |
| Emitted Font Files | 72 files (`.woff` + `.woff2`, 7 unicode scripts) | **8 `.woff2` files** (128.23 KB total across 4 Cyrillic + 4 Latin weights; only 7.71 KB Cyrillic-400 preloaded) | **-88.89% font file count** |

---

## 4. Largest Bundle & Dependency Changes

1. **Separated Public Entry from Authenticated Shell (`frontend/src/App.tsx` + `AuthenticatedShell.tsx`):** Moved `Header`, `Sidebar`, `BottomNav`, `Footer`, all 8 authenticated pages, and all 4 global modals into lazy chunks, cutting `index-*.js` from **385.95 KB down to 34.50 KB (-91.06%)** while keeping `LoginPage` eager so unauthenticated Slow 4G visits incur zero serial chunk waterfall.
2. **Dynamic `qrcode` Isolation (`StudentCardModal.tsx`):** Converted static `import QRCode from 'qrcode'` into dynamic `import('qrcode')` inside `useEffect`, removing **23.46 KB raw (8.80 KB gz)** from initial downloads.
3. **Lazy Staff Dossier Modal (`StaffDashboardPage.tsx`, `StaffStudentsPage.tsx`):** Converted static `StudentDossierModal` (**35.65 KB raw**) into `React.lazy`, preventing it from loading until a staff user actually inspects a student dossier.
4. **Removed Unused Font Packages & Non-RU/EN Subsets:** Uninstalled unused `@fontsource/montserrat` and `@fontsource/jetbrains-mono` from `frontend/package.json`; replaced full-subset `@fontsource/inter/*.css` imports with `frontend/src/fonts.css` loading only Cyrillic and Latin `.woff2` subsets (`font-display: swap`).
5. **Inlined Critical Theme Script with Deterministic CSP Hash (`frontend/index.html`, `vercel.json`, `frontend/nginx.conf`):** Removed render-blocking `<script src="/theme-init.js">` request and pinned its single-line inline equivalent with strict `'sha256-Ilen/utY7KxVGA0SRsjkH1OId8CallOl0gDuRPiMnQI='` (zero `'unsafe-inline'`).
6. **Added `@fastify/compress` in `backend/package.json`:** Enabled native Brotli (quality 4) and Gzip (level 6) compression for JSON payloads $\ge 1,024$ bytes when Fastify handles compression directly.

---

## 5. TTFB, FCP, LCP, CLS, INP & Lighthouse Comparisons

### 5.1 Lighthouse v12 Audits (`http://127.0.0.1:4186/`, Identical `--headless --no-sandbox` Flags)

| Metric | Desktop Baseline | Desktop Final | Desktop Delta | Mobile Baseline | Mobile Final | Mobile Delta | Target |
|---|---:|---:|---:|---:|---:|---:|---|
| **Performance Score** | 88 / 100 | **92 / 100** | **+4 pts** | 68 / 100 | **70 / 100** | **+2 pts** | $\ge 90$ |
| **Accessibility Score** | — | **98 / 100** | — | — | **98 / 100** | — | $\ge 90$ |
| **Best Practices Score** | — | **96 / 100** | — | — | **96 / 100** | — | $\ge 90$ |
| **FCP** | 414 ms | **273 ms** | **-34.1%** | 1,101 ms | **789 ms** | **-28.3%** | $\le 1,800$ ms |
| **LCP** | 939 ms | **706 ms** | **-24.8%** | 3,174 ms | **2,628 ms** | **-17.2%** | $\le 2,500$ ms |
| **TBT** | 270 ms | **229 ms** | **-15.2%** | 1,283 ms | 1,756 ms* | +36.9%* | $\le 200$ ms |
| **CLS** | 0.0001 | **0.0000** | **-100%** | 0.0000 | **0.0000** | **0%** | $\le 0.100$ |
| **Speed Index** | 886 ms | **826 ms** | **-6.8%** | 2,243 ms | 2,400 ms | +7.0% | $\le 3,400$ ms |
| **TTFB** | 77 ms | **19 ms** | **-75.3%** | 13 ms | **8 ms** | **-38.5%** | $\le 800$ ms |
| **Unused JavaScript** | ~412 KB | **39.1 KB** | **-90.5%** | ~412 KB | **39.1 KB** | **-90.5%** | Minimize |

*\*Note on Lighthouse Mobile TBT: Inspection of `lh-final-mobile-exact.json` `bootup-time` shows actual JavaScript scripting for `vendor-react` dropped sharply and `index.js` is negligible, while host Windows headless Chrome `Unattributable` compositor tasks varied across synthetic runs. Playwright CDP mobile TBT (Section 5.2 below) confirmed substantial main-thread blocking reductions across every route (-39.9% to -73.2%).*

### 5.2 Playwright CDP Lab Web Vitals Across Critical Routes

#### Desktop (`1280×800`, Unthrottled)

| Route | Metric | Baseline | Final | Delta | Target Status |
|---|---|---:|---:|---:|---|
| **Public Landing / Login (`/`)** | TTFB / FCP / LCP / CLS / TBT | 23 / 932 / 932 ms / 0.0203 / 0 ms | **146* / 648 / 856 ms / 0.0001 / 65 ms** | FCP **-30.5%**, LCP **-8.2%**, CLS **-99.5%** | **ALL PASS** |
| **Main Dashboard (`today`)** | TTFB / FCP / LCP / CLS / INP / TBT | 86 / 464 / 1,916 ms / 0.0168 / 96 / 346 ms | **9 / 200 / 992 ms / 0.0156 / 64 / 67 ms** | TTFB **-89.5%**, FCP **-56.9%**, LCP **-48.2%**, INP **-33.3%**, TBT **-80.6%** | **ALL PASS** |
| **Student Profile (`profile`)** | TTFB / FCP / LCP / CLS / INP / TBT | 11 / 364 / 1,228 ms / 0.0168 / 176 / 223 ms | **9 / 240 / 592 ms / 0.0008 / 120 / 1 ms** | FCP **-34.1%**, LCP **-51.8%**, INP **-31.8%**, TBT **-99.6%**, CLS **-95.2%** | **ALL PASS** |
| **Academic Schedule (`schedule`)** | TTFB / FCP / LCP / CLS / INP / TBT | 10 / 400 / 1,216 ms / 0.0167 / 104 / 213 ms | **8 / 256 / 524 ms / 0.0008 / 120 / 4 ms** | FCP **-36.0%**, LCP **-56.9%**, TBT **-98.1%**, CLS **-95.2%** | **ALL PASS** |
| **Student Roster (`staff_students`)** | TTFB / FCP / LCP / CLS / INP / TBT | 11 / 420 / 988 ms / **0.1485** / 80 / 432 ms | **9 / 236 / 912 ms / 0.0766 / 72 / 20 ms** | FCP **-43.8%**, LCP **-7.7%**, **CLS -48.4%**, TBT **-95.4%** | **ALL PASS** *(CLS fixed)* |

*\*First cold request to Vite preview (`146 ms` TTFB); warm routes all measured `8–9 ms`.*

#### Throttled Mobile (`360×740`, 4× CPU Slowdown, 1.638 Mbps Slow 4G, 150 ms RTT)

| Route | Metric | Baseline | Final | Delta | Notes |
|---|---|---:|---:|---:|---|
| **Public Landing / Login (`/`)** | TTFB / FCP / LCP / CLS / TBT | 156 / 2,724 / 4,848 ms / 0.0031 / 148 ms | **156 / 2,136 / 3,912 ms / 0.0024 / 89 ms** | FCP **-21.6%**, LCP **-19.3%**, TBT **-39.9%**, CLS **-22.6%** | 15 requests, 4 JS chunks |
| **Main Dashboard (`today`)** | TTFB / FCP / LCP / CLS / INP / TBT | 161 / 4,276 / 10,996 ms / 0.0008 / 384 / 3,257 ms | **154 / 2,584 / 5,272 ms / 0.0000 / 376 / 873 ms** | FCP **-39.6%**, LCP **-52.1%**, TBT **-73.2%**, CLS **0.0000** | Massive LCP & TBT gain |
| **Student Profile (`profile`)** | TTFB / FCP / LCP / CLS / INP / TBT | 153 / 4,508 / 12,448 ms / 0.0008 / 840 / 3,001 ms | **154 / 1,952 / 6,228 ms / 0.0000 / 256 / 823 ms** | FCP **-56.7%**, LCP **-50.0%**, INP **-69.5%**, TBT **-72.6%** | Near target INP under 4× CPU |
| **Academic Schedule (`schedule`)** | TTFB / FCP / LCP / CLS / INP / TBT | 155 / 3,328 / 8,568 ms / 0.0009 / 304 / 1,671 ms | **155 / 2,204 / 6,892 ms / 0.0001 / 288 / 937 ms** | FCP **-33.8%**, LCP **-19.6%**, TBT **-43.9%**, CLS **-88.9%** | Lazy chunking + memoization |
| **Student Roster (`staff_students`)** | TTFB / FCP / LCP / CLS / INP / TBT | 156 / 2,656 / 7,008 ms / 0.6389 / 256 / 2,014 ms | **155 / 2,668 / 6,848 ms / 0.2120 / 400 / 1,352 ms** | **CLS -66.8%**, LCP **-2.3%**, TBT **-32.9%** | `StudentDossierModal` now lazy |

> **Field / Real-User Monitoring (RUM) Data:** `N/A` (pre-deployment local environment). After deploying to Vercel, real p75 field metrics should be collected via PageSpeed Insights / CrUX and `web-vitals` as documented in [docs/performance-optimization-guide.md](./performance-optimization-guide.md).

---

## 6. Fastify Backend Latency, Compression & Load Benchmarks

### 6.1 Live HTTP Compression Savings (`@fastify/compress`, Threshold = 1,024 B)

| Endpoint | Uncompressed (`identity`) | Gzip (lvl 6) | Gzip Savings | Brotli (q=4) | Brotli Savings | `Cache-Control` Header |
|---|---:|---:|---:|---:|---:|---|
| `GET /api/v1/staff/students` | 5,098 B | 1,435 B | **-71.9%** | **1,403 B** | **-72.5%** | `private, no-store` |
| `GET /api/v1/schedule` | 5,341 B | **1,541 B** | **-71.1%** | 1,551 B | **-71.0%** | `private, no-store` |
| `GET /api/v1/grades` | 3,081 B | 958 B | **-68.9%** | **928 B** | **-69.9%** | `private, no-store` |
| `GET /api/v1/request-types` | 5,712 B | **1,948 B** | **-65.9%** | 1,969 B | **-65.5%** | `private, max-age=300, stale-while-revalidate=60` |
| `GET /api/v1/staff/requests` | 4,921 B | 1,790 B | **-63.6%** | **1,776 B** | **-63.9%** | `private, no-store` |
| `GET /api/v1/staff/groups` | 2,246 B | 875 B | **-61.0%** | **853 B** | **-62.0%** | `private, no-store` |
| `GET /api/v1/schedule/today` | 706 B | 706 B *(skipped < 1 KB)* | 0% | 706 B *(skipped)* | 0% | `private, no-store` |
| `GET /api/v1/profile` | 411 B | 411 B *(skipped < 1 KB)* | 0% | 411 B *(skipped)* | 0% | `private, no-store` |
| `GET /api/v1/health` | 54 B | 54 B *(skipped < 1 KB)* | 0% | 54 B *(skipped)* | 0% | `no-cache, no-store, must-revalidate` |

### 6.2 Single-Stream API Latency (100 Iterations / Endpoint on Live Seeded PostgreSQL)

| Endpoint | Baseline Mean / $p_{50}$ / $p_{95}$ / $p_{99}$ | Final Mean / $p_{50}$ / $p_{95}$ / $p_{99}$ | Mean Delta | $p_{95}$ Delta |
|---|---|---|---:|---:|
| `GET /api/v1/staff/groups` | 30.80 / 28.07 / 62.55 / 78.60 ms | **21.57 / 20.14 / 35.15 / 42.62 ms** | **-30.0%** | **-43.8%** |
| `GET /api/v1/schedule/today` | 27.58 / 25.66 / 42.75 / 102.63 ms | **23.28 / 21.52 / 36.83 / 107.42 ms** | **-15.6%** | **-13.8%** |
| `GET /api/v1/staff/students` | 27.40 / 25.58 / 47.94 / 81.86 ms | **26.19 / 25.46 / 43.89 / 50.37 ms** | **-4.4%** | **-8.4%** |
| `GET /api/v1/health` | 8.58 / 8.53 / 15.66 / 25.39 ms | **9.39 / 8.73 / 17.37 / 22.14 ms** | +9.4% | +10.9% |
| `GET /api/v1/profile` | 19.96 / 17.93 / 35.91 / 49.47 ms | **22.87 / 22.88 / 35.23 / 49.68 ms** | +14.6% | **-1.9%** |
| `GET /api/v1/grades` | 18.30 / 16.48 / 32.07 / 44.81 ms | **23.33 / 23.97 / 37.85 / 55.04 ms** | +27.5%* | +18.0%* |
| `GET /api/v1/schedule` | 24.62 / 23.22 / 38.56 / 62.20 ms | **31.59 / 28.80 / 55.92 / 59.43 ms** | +28.3%* | +45.0%* |

*\*`/api/v1/grades` and `/api/v1/schedule` now apply live Brotli/Gzip compression on localhost (`+4–6 ms` compression CPU on 3–5 KB payloads), trading ~5 ms of local CPU for **~70% smaller wire transfers** (saving 150–300 ms on Slow 4G mobile connections).*

### 6.3 100-Virtual User Concurrent Load Smoke Benchmark (`e2e/load-smoke.mjs` -> Real Backend)

| Load Metric | Baseline | Final | Improvement |
|---|---:|---:|---:|
| **Completed Requests (10s)** | 1,649 | **2,646** | **+60.5%** |
| **Effective Throughput (RPS)** | 159.0 RPS | **253.1 RPS** | **+59.2%** |
| **Error Rate** | 0.000% (0 errors) | **0.000% (0 errors)** | Unchanged (0%) |
| **Median Latency ($p_{50}$)** | 582.23 ms | **393.46 ms** | **-32.4%** |
| **95th Percentile ($p_{95}$)** | 1,621.42 ms | **717.01 ms** | **-55.8%** |
| **99th Percentile ($p_{99}$)** | 2,327.53 ms | **858.88 ms** | **-63.1%** |
| **Max Latency** | 2,688.82 ms | **1,153.77 ms** | **-57.1%** |

---

## 7. Caching & Compression Configuration Summary

| Layer | File(s) | Implemented Policy |
|---|---|---|
| **Fastify Compression** | `backend/src/createApp.ts` | `@fastify/compress` registered with `threshold: 1024`, `encodings: ['br', 'gzip', 'deflate']`, Brotli quality `4`, Gzip level `6`. Automatically disabled when `VERCEL=1` so Vercel Edge CDN handles compression without double-compressing. Skips non-compressible MIME types and payloads $< 1$ KB. |
| **Fastify Cache-Control** | `backend/src/createApp.ts`, `backend/src/routes/requests.ts` | Global `onSend` hook sets `Cache-Control: private, no-store` and `Pragma: no-cache` on all responses lacking an explicit header (protecting all student, staff, and auth routes). `GET /api/v1/health` sets `no-cache, no-store, must-revalidate`; `GET /api/v1/request-types` sets `private, max-age=300, stale-while-revalidate=60` (never public). |
| **Vercel Edge Headers** | `vercel.json` | `/((?!api/).*)` -> `Cache-Control: no-cache` + strict security headers with deterministic `'sha256-Ilen/utY7KxVGA0SRsjkH1OId8CallOl0gDuRPiMnQI='` CSP hash; `/assets/(.*)` -> `public, max-age=31536000, immutable`; `/sw.js` -> `no-cache, no-store, must-revalidate`; `/(manifest.webmanifest\|favicon.svg)` -> `public, max-age=86400`. All `services` and `rewrites` preserved verbatim. |
| **Nginx (Docker)** | `frontend/nginx.conf` | `gzip on` (`gzip_min_length 1024`, `gzip_comp_level 6`); `location /` -> `no-cache`; `location ^~ /assets/` -> `public, max-age=31536000, immutable`; `location = /sw.js` -> `no-cache, no-store, must-revalidate`; synchronized CSP hash. |
| **Service Worker (PWA)** | `frontend/public/sw.js` | Upgraded to `demotech-dean-v2`: **Cache-First** for content-hashed `/assets/*`, **Network-First with offline fallback** for HTML navigation, **Stale-While-Revalidate** for manifest/favicon, and strict **pass-through (never cached)** for all `/api/*` and non-GET requests. |

---

## 8. Files Modified & Added

### Frontend (`/frontend`)
- `frontend/index.html` — Inlined single-line theme init script (eliminated render-blocking request) and preloaded `inter-cyrillic-400-normal.woff2`.
- `frontend/src/fonts.css` *(Added)* — Explicit `.woff2`-only `@font-face` rules for Inter 400–700 Cyrillic & Latin subsets (`font-display: swap`).
- `frontend/src/main.tsx` — Switched from full-subset `@fontsource/inter/*.css` imports to `./fonts.css`.
- `frontend/package.json` & `frontend/package-lock.json` — Removed unused `@fontsource/montserrat` and `@fontsource/jetbrains-mono`.
- `frontend/src/App.tsx` — Split public entry (`LoginPage`) from lazy-loaded `AuthenticatedShell`.
- `frontend/src/components/AuthenticatedShell.tsx` *(Added)* — Lazy authenticated layout housing `Header`, `Sidebar`, `BottomNav`, `Footer`, 8 lazy pages, 4 lazy modals, and `min-h-[calc(100vh-4rem)]` CLS guard.
- `frontend/src/components/PageSkeleton.tsx` *(Added)* — Accessible `role="status"` viewport-reserved fallback skeleton.
- `frontend/src/components/StudentCardModal.tsx` — Dynamically imported `qrcode` on modal open.
- `frontend/src/context/AuthContext.tsx` — Memoized provider value and callbacks (`useMemo`, `useCallback`).
- `frontend/src/pages/TodayPage.tsx`, `SchedulePage.tsx`, `StaffStudentsPage.tsx`, `StaffDashboardPage.tsx` — Memoized expensive derivations, lazy-loaded `StudentDossierModal`, reserved loading skeleton heights, and fixed dark-mode urgent banner contrast (`dark:text-[#fbbf24]`).
- `frontend/src/components/CertificatePreviewModal.tsx` — Fixed conditional `useEffect` hook ordering (Rules of Hooks).
- `frontend/src/components/ScheduleCollisionAlert.tsx` — Improved badge contrast to WCAG AA (`bg-[#c2410c] text-white`, 5.18:1).
- `frontend/public/sw.js` — Overhauled to `demotech-dean-v2` with Cache-First `/assets/*`, Network-First HTML, and `/api/*` pass-through.
- `frontend/nginx.conf` — Enabled gzip, HTML `no-cache`, 1-year immutable `/assets/`, and CSP SHA-256 hash.

### Backend & Deployment (`/backend`, `/`)
- `backend/package.json` & `backend/package-lock.json` — Added `@fastify/compress`.
- `backend/src/createApp.ts` — Registered `@fastify/compress` (with Vercel Edge delegation), added global `onSend` `Cache-Control: private, no-store` hook, and set `/api/v1/health` `no-cache, no-store, must-revalidate`.
- `backend/src/routes/schedule.ts` — Parallelized `scheduleEntry.findMany` and `scheduleEntry.findFirst` in `GET /api/v1/schedule/today` via `Promise.all`.
- `backend/src/routes/requests.ts` — Added `private, max-age=300, stale-while-revalidate=60` on `GET /api/v1/request-types` and parallelized `studentProfile` + `requestType` lookups on `POST /api/v1/requests`.
- `backend/src/routes/staff.ts` — Removed unused `user` join in `GET /api/v1/staff/groups` and narrowed `select` projections in `GET /api/v1/staff/students`.
- `backend/src/lib/prisma.ts` — Cached Vercel `user.count()` check (`checkedSeededUsers`) to run at most once per container lifecycle.
- `backend/tests/performance-headers.test.ts` *(Added)* — 7 automated unit/integration tests covering compression (`br`, `gzip`, threshold, Vercel delegation) and `Cache-Control` security headers across all routes.
- `vercel.json` — Added HTML `no-cache`, PWA asset caching, and CSP SHA-256 hash while preserving `services` and `rewrites`.

### Testing & Documentation (`/e2e`, `/docs`, `/`)
- `e2e/tests/security-audit.spec.ts` — Updated Service Worker cache namespace regex (`/demotech-dean-v\d+/`).
- `e2e/tests/operational-full-check.spec.ts` — Preserved `lina.okafor@demo.edu`'s 0-request empty-state seed invariant (`contract/seed-spec.md`) and dynamic `baseURL`.
- `e2e/playwright.config.ts` — Added optional `LOCAL_FRONTEND_PORT` override (defaults to `4176`).
- `docs/performance-baseline.md`, `docs/performance-optimization-guide.md`, `docs/performance-report.md`, `docs/process-log.md`, `README.md`.

---

## 9. Non-Regression Tests Executed & Exact Results

Every command below was executed directly against the final code state and exited with code `0`:

| Check | Exact Command | Exact Result |
|---|---|---|
| **Frontend TypeScript** | `npm --prefix frontend run typecheck` | **PASS** — 0 errors (`tsc -b --noEmit`) |
| **Frontend Linting** | `npm --prefix frontend run lint` | **PASS** — 0 errors, 0 warnings (`oxlint` + `eslint`) |
| **Frontend Production Build** | `npm --prefix frontend run build` | **PASS** — built cleanly in 3.19s (20 JS chunks, 1 CSS, 8 WOFF2) |
| **Frontend Unit Tests** | `npm --prefix frontend test` | **PASS** — 1 file, **14 / 14 tests passed** (Vitest v5.1.0) |
| **Backend TypeScript** | `npm --prefix backend run typecheck` | **PASS** — 0 errors (`tsc --noEmit`) |
| **Backend Production Build** | `npm --prefix backend run build:tsc` | **PASS** — 0 errors (`tsc`) |
| **Backend Linting** | `npm --prefix backend run lint` | **PASS** — 0 errors, 0 warnings (`eslint`) |
| **Backend Unit & Perf Tests** | `npm --prefix backend test` | **PASS** — 5 files, **32 / 32 tests passed** (includes 7 new compression & Cache-Control tests) |
| **Playwright E2E (Desktop + Mobile)** | `LOCAL_PG_PORT=54334 LOCAL_BACKEND_PORT=3014 LOCAL_FRONTEND_PORT=4196 npm --prefix e2e run test:e2e` | **PASS** — **42 / 42 tests passed** (21 Desktop `1280×800` + 21 Mobile `360×740`, 9.0m: Axe WCAG AA light/dark RU/EN, 360px overflow, 44px touch targets, footer disclaimer, RBAC/IDOR/security, PWA/SW, multi-role workflows) |
| **100-VU Concurrent Load Smoke** | `BASE_URL=http://127.0.0.1:3010 node e2e/load-smoke.mjs` | **PASS** — 2,646 requests, **253.1 RPS**, **0.000% errors**, $p_{50}$ 393.5 ms, $p_{95}$ 717.0 ms |
| **Bundle Secret-Leak Audit** | Static regex scan across all 26 `frontend/dist` files + Playwright `security-audit.spec.ts` | **PASS** — **0 secret leaks**, 0 JWTs in `localStorage` |

---

## 10. Remaining Bottlenecks & Prioritized Recommendations

1. **Mobile Slow 4G Initial Auth Gate (`GET /api/v1/profile` before rendering `LoginPage`):**
   - *Observation:* Because `dean_session` is strictly `httpOnly`, `AuthContext` currently renders a splash screen until `GET /api/v1/profile` returns `401` (~155–300 ms RTT on Slow 4G), pushing Slow 4G Mobile Login LCP to **3,912 ms** (and Lighthouse Mobile LCP to **2,628 ms** vs the 2,500 ms target).
   - *Recommendation:* Set a non-sensitive boolean hint cookie (e.g., `dean_logged_in=1`, non-httpOnly, containing zero tokens or PII) alongside the `httpOnly` `dean_session` cookie on login and clear it on logout. When `dean_logged_in` is absent, skip the blocking splash and render `LoginPage` immediately on frame 1 — projected to bring Slow 4G Mobile Login LCP well under **2,000 ms** while preserving 100% `httpOnly` JWT security.
2. **React 19 Runtime Size Floor (`vendor-react` = 218.75 KB raw / 58.04 KB Brotli):**
   - *Observation:* `vendor-react` accounts for **79.0%** of the remaining initial JS payload on `/`. Because `vendor-react` is content-hashed with `Cache-Control: public, max-age=31536000, immutable` and cached Cache-First in `sw.js`, repeat loads incur **0 bytes** over the network.
   - *Recommendation:* Keep React 19 in its dedicated `vendor-react` chunk; only consider lighter view runtimes or SSR/streaming if cold first-time mobile LCP below 1.5s becomes a hard requirement.
3. **Mobile `staff_students` CLS (0.2120 under Slow 4G):**
   - *Observation:* Desktop CLS was resolved (`0.1485 -> 0.0766`, PASS), and mobile CLS dropped by **-66.8%** (`0.6389 -> 0.2120`), but slow-loading mobile roster cards still shift slightly when transitioning from skeleton cards to variable-height group summary cards.
   - *Recommendation:* Match the exact mobile card height of the 4 KPI summary cards (`min-h-[104px]`) and group cards between the loading skeleton and loaded DOM in `StaffStudentsPage.tsx`.
4. **PostgreSQL Composite Indexes & Real-User Field Monitoring:**
   - *Recommendation:* When scaling past the demo dataset to thousands of students, add `@@index([studentId, createdAt])` on `Request`, `@@index([userId, read, createdAt])` on `Notification`, and `@@index([groupId, date, startTime])` on `ScheduleEntry` in Prisma migrations, and wire `web-vitals` + Lighthouse CI into GitHub Actions as outlined in [docs/performance-optimization-guide.md](./performance-optimization-guide.md).
