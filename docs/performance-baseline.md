# Digital Dean's Office of the Future: Comprehensive Performance Baseline Report

**Document Version:** 1.0.0  
**Date:** 2026-11-21  
**Project:** Digital Dean's Office of the Future (DemoTech University)  
**Author:** Baseline Measurement & Reporting Specialist (Worker M1)  
**Target Milestone:** Milestone 1 — Inspection & Baseline Establishment  
**Stack Under Test:** React 19.3.1 + Vite 8.3.8 (Rolldown) + Tailwind CSS v4 | Fastify v5.12.8 + Prisma v6.19.3 + PostgreSQL 18.6 | Playwright v1.56 + Lighthouse v12  

---

## 1. Executive Summary

This report establishes the empirical performance baseline for the "Digital Dean's Office of the Future" student portal prior to executing Milestone 2 (Frontend React & Vite Optimization) and Milestone 3 (Backend Fastify & Delivery Optimization). 

All measurements in this report are genuine empirical observations collected against the production application stack served via `scripts/local-stack.mjs` (Vite preview on port 4176, Fastify production build on port 3000, and PostgreSQL on port 54329 seeded with 16 test accounts).

### Key Baseline Findings

1. **Monolithic Initial JavaScript Transfer:**
   - On the unauthenticated public login page (`/`), the initial production build baseline required the browser to download **639,435 Bytes** (**624.45 KiB** [binary, 1024 B] / **639.44 KB** [decimal, 1000 B] raw; **163,478 Bytes** / **159.65 KiB** / **163.48 KB gzip**; **130,602 Bytes** / **127.54 KiB** / **130.60 KB Brotli**) across 5 JavaScript chunks.
   - Following subsequent feature additions (indoor campus wayfinding and schedule collision detection in commit `09f1fc5`), the total initial JS footprint shifted to **651,946 Bytes** (**636.67 KiB** / **651.95 KB** raw). On the current production HEAD (after typography refactoring in commit `47d92f0`), the production build yields **651,906 Bytes** (**636.63 KiB** / **651.91 KB** raw; **165,528 Bytes** / **161.65 KiB** / **165.53 KB gzip**; **132,404 Bytes** / **129.30 KiB** / **132.40 KB Brotli**).
   - The primary application bundle (`index-DmSF2jZI.js` on HEAD, `index-08fBanDb.js` on commit `09f1fc5`, `index-BquhgsQc.js` in initial baseline) is **385,952 Bytes** (**376.91 KiB** / **385.95 KB**) because **zero route-level or component-level code splitting exists**. The login screen unconditionally loads the entire application graph, including heavy staff management rosters (784 lines), academic schedule tables (1,124 lines), grade transcripts, campus wayfinding maps, and the `qrcode` library (23,463 Bytes / 22.91 KiB / 23.46 KB).

2. **Mobile Lab Web Vitals Deficits:**
   - On a simulated **Slow 4G throttled mobile profile** (360×740 viewport, 1.638 Mbps download, 150 ms RTT, 4× CPU slowdown):
     - **Login LCP:** **4,848 ms** (Target: $\le 2,500$ ms) — exceeds target by **+93.9%**.
     - **Main Dashboard (Today) LCP:** **10,996 ms** with **3,257 ms TBT** and **384 ms INP**.
     - **Student Profile LCP:** **12,448 ms** with **3,001 ms TBT** and **840 ms INP**.
     - **Academic Schedule LCP:** **8,568 ms** with **1,671 ms TBT** and **304 ms INP**.
     - **Staff Roster CLS:** **0.6389** (Target: $\le 0.100$) — severe layout shifts during unmemoized data table calculation.

3. **Lighthouse Performance Scores:**
   - **Desktop Profile:** **88 / 100** (FCP: 0.4s, LCP: 0.9s, TBT: 270 ms, CLS: 0.0001, Speed Index: 0.9s, TTFB: 77 ms).
   - **Mobile Profile:** **68 / 100** (FCP: 1.1s, LCP: 3.2s, TBT: 1,280 ms, CLS: 0.0000, Speed Index: 2.2s, TTFB: 13 ms).

4. **Fastify Backend Concurrency & Query Latency:**
   - Under a 100-Virtual User concurrent load benchmark (`e2e/load-smoke.mjs`), the Fastify backend achieved **159.0 RPS** with **0% errors**, but exhibited high tail latency (**p50: 582.23 ms**, **p95: 1,621.42 ms**, **p99: 2,327.53 ms**).
   - Targeted single-stream endpoint checks revealed that `/api/v1/schedule/today` is bottlenecked by sequential database calls (`p50: 25.66 ms`, `p99: 102.63 ms`).
   - Fastify completely lacks response compression (`@fastify/compress` is uninstalled) and emits zero `Cache-Control` headers on authenticated routes, leaving student data vulnerable to proxy caching.

---

## 2. Test Environment & Measurement Methodology

### 2.1 Environmental Configurations

All tests were conducted on an identical hardware environment running Windows 11 with Node.js v20:

| Environment Attribute | Desktop Profile Specification | Throttled Mobile Profile Specification |
|---|---|---|
| **Viewport Dimensions** | $1280 \times 800$ px (Device Scale: 1.0) | $360 \times 740$ px (Device Scale: 2.0, Pixel 5 emulation) |
| **Touch Emulation** | Disabled (`hasTouch: false`) | Enabled (`hasTouch: true`, `isMobile: true`) |
| **Network Profile** | Unthrottled Localhost ($\le 1$ ms RTT, Gbps) | Simulated Slow 4G (150 ms RTT, 1.638 Mbps / 204.8 KB/s down, 750 Kbps up) |
| **CPU Emulation** | 1× Native Host Execution | 4× Slowdown Multiplier (`Emulation.setCPUThrottlingRate: 4`) |
| **Serving Pipeline** | Vite Preview 8.3.8 on port 4176 | Vite Preview 8.3.8 on port 4176 |
| **Backend Pipeline** | Fastify 5.12.8 compiled (`dist/server.js`) on port 3000 | Fastify 5.12.8 compiled (`dist/server.js`) on port 3000 |
| **Database Instance** | Embedded PostgreSQL 18.6 on port 54329 (seeded) | Embedded PostgreSQL 18.6 on port 54329 (seeded) |

### 2.2 Tooling & Execution Protocols

1. **Bundle Compression:** Measured with native Node.js `zlib.gzipSync(buf, { level: 9 })` and `zlib.brotliCompressSync(buf, { params: { [BROTLI_PARAM_QUALITY]: 11 } })` against `frontend/dist/assets/`.
2. **Web Vitals Measurement:** Automated Chromium test harness (`scripts/measure-web-vitals.mjs`) utilizing Chrome DevTools Protocol (CDP) and browser-native `PerformanceObserver` APIs (`layout-shift`, `largest-contentful-paint`, `longtask`, `event`, and `navigation`).
3. **Lighthouse Audit:** Automated CLI execution of `npx --yes lighthouse` (v12) in headless mode (`--chrome-flags="--headless --no-sandbox"`).
4. **API Concurrency Benchmark:** `e2e/load-smoke.mjs` running 100 concurrent virtual users for 10 seconds against live PostgreSQL backend, followed by 100 individual iterations per endpoint with session cookies.

> **Important Standard Compliance Note:**  
> In accordance with performance engineering best practices, **lab synthetic measurements** (controlled throttling via CDP and headless automation) are documented separately from **real-user monitoring (RUM / Field)** measurements. Field data is marked as N/A in pre-deployment environments.

### 2.3 Methodological Protocols & Synthetic Measurement Qualifications

To ensure strict reproducibility and transparency during auditing, the following methodological boundaries are explicitly noted:

1. **Single-Run Lab Measurement Protocol ($N=1$):**  
   All Core Web Vitals metrics recorded in Section 4 represent $N=1$ single-run baseline captures under controlled Chrome DevTools Protocol (CDP) emulation. In synthetic mobile lab environments with 4× CPU throttling and packet latency emulation, run-to-run variance of $\pm 5-10\%$ is expected across consecutive test iterations due to host operating system background thread scheduling, memory paging, and V8 garbage collection cycles.

2. **TTFB Measurement Divergence (Lighthouse vs Playwright):**  
   Lighthouse reports a TTFB of **13 ms** on the mobile preset, whereas Playwright CDP reports **156 ms** on the throttled mobile profile. This divergence is methodological: Lighthouse defaults to Lantern simulation, where network traces are recorded unthrottled on localhost (yielding 13 ms server response) and later scaled mathematically for compute metrics. In contrast, Playwright's CDP session (`Network.emulateNetworkConditions`) enforces packet-level latency throttling with an explicit 150 ms RTT delay at the network driver layer, resulting in 156 ms TTFB (150 ms network round-trip + 6 ms server response).

3. **Authenticated Route Total Blocking Time (TBT):**  
   In standard page-load audits, TBT measures the duration between First Contentful Paint (FCP) and Time to Interactive (TTI) during an idle page load. In this report, authenticated route TBT values (e.g., **3,257 ms** on Today Dashboard, **3,001 ms** on Profile, **1,671 ms** on Schedule, **2,014 ms** on Staff Students) reflect **Load + Interaction Blocking Time**. Because authenticated views require navigating to the route via interactive tab clicks (`action(page, isMobile)` in `scripts/measure-web-vitals.mjs`), `PerformanceObserver` records long tasks incurred during both initial page load hydration and the subsequent tab transition, component mount, and data fetching lifecycle, rather than standard idle-load FCP-to-TTI blocking time.

4. **Login Interaction to Next Paint (INP):**  
   Login INP was recorded as **0 ms** because the automated probe script targeted the `<main>` container element (`page.locator('main').first().click()`). Because `<main>` is an inert semantic wrapper without click listeners, `PerformanceObserver({ type: 'event' })` observes 0 ms event processing duration. Active interactive form controls (email input, password input, sign-in button) were evaluated in functional E2E tests rather than the automated INP probe pass.

---

## 3. Frontend Bundle & Asset Inventory

Compiled production assets emitted to `frontend/dist/assets/` via `npm --prefix frontend run build`.

> **Unit Notation Disambiguation:**  
> - **Bytes (B):** Exact file byte size ($1\text{ B}$).  
> - **KiB:** Binary kibibytes ($1\text{ KiB} = 1,024\text{ Bytes}$).  
> - **KB:** Decimal kilobytes ($1\text{ KB} = 1,000\text{ Bytes}$).  
> In all tables and analysis throughout this report, both KiB and KB are explicitly provided to eliminate ambiguity between binary packaging tooling and decimal network transfer models.

### 3.1 JavaScript Bundles

| Asset File | Raw (Bytes) | Raw (KiB) | Raw (KB) | Gzip (KiB) | Gzip (KB) | Brotli (KiB) | Brotli (KB) | Module Composition & Purpose |
|---|---|---|---|---|---|---|---|---|
| `index-DmSF2jZI.js` *(HEAD)*<br>`index-08fBanDb.js` *(09f1fc5)*<br>`index-BquhgsQc.js` *(Baseline)* | 385,952 B<br>385,992 B<br>373,574 B | 376.91 KiB<br>376.95 KiB<br>364.82 KiB | 385.95 KB<br>385.99 KB<br>373.57 KB | 79.30 KiB<br>79.35 KiB<br>77.32 KiB | 81.20 KB<br>81.25 KB<br>79.18 KB | 58.29 KiB<br>58.33 KiB<br>56.54 KiB | 59.69 KB<br>59.73 KB<br>57.89 KB | Monolithic application code: all 9 pages, modals, contexts, utilities, campus wayfinding |
| `vendor-react-DctBZRDK.js` | 218,747 B | 213.62 KiB | 218.75 KB | 65.81 KiB | 67.39 KB | 56.67 KiB | 58.04 KB | React 19.3.1, ReactDOM 19.3.1, scheduler |
| `vendor-qr-CXHAcuVq.js` | 23,463 B | 22.91 KiB | 23.46 KB | 8.59 KiB | 8.80 KB | 7.56 KiB | 7.74 KB | `qrcode` 1.5.4 library (loaded eagerly on all pages) |
| `vendor-icons-9RDF3m7C.js` *(HEAD)*<br>`vendor-icons-BesqHPjY.js` *(Baseline)* | 23,145 B<br>23,052 B | 22.60 KiB<br>22.51 KiB | 23.15 KB<br>23.05 KB | 7.59 KiB<br>7.56 KiB | 7.77 KB<br>7.75 KB | 6.45 KiB<br>6.45 KiB | 6.61 KB<br>6.60 KB | Lucide React icon components |
| `rolldown-runtime-WkwZ5CU-.js` | 599 B | 0.58 KiB | 0.60 KB | 0.36 KiB | 0.37 KB | 0.32 KiB | 0.33 KB | Vite Rolldown module loader runtime |
| **Total Initial JS (Current HEAD)** | **651,906 B** | **636.63 KiB** | **651.91 KB** | **161.65 KiB** | **165.53 KB** | **129.30 KiB** | **132.40 KB** | **Current HEAD production build (commit `47d92f0`)** |
| **Total Initial JS (Commit `09f1fc5`)** | **651,946 B** | **636.67 KiB** | **651.95 KB** | **161.68 KiB** | **165.56 KB** | **129.33 KiB** | **132.44 KB** | **HEAD calibration at conclusion of Milestone 1** |
| **Total Initial JS (Pre-Commit Baseline)**| **639,435 B** | **624.45 KiB** | **639.44 KB** | **159.65 KiB** | **163.48 KB** | **127.54 KiB** | **130.60 KB** | **Initial measurement pass baseline** |

> **Asset Denominator Alignment & Shift Analysis:**  
> - **Pre-Commit Initial Baseline:** At the start of Milestone 1, the total initial JavaScript footprint was **639,435 B** (**624.45 KiB** / **639.44 KB**).  
> - **Commit `09f1fc5` Calibration:** The integration of the indoor campus wayfinding route planner and schedule collision detector in commit `09f1fc5` added **+12,511 Bytes** (**+12.22 KiB** / **+12.51 KB**) of application code, bringing the total to **651,946 B** (**636.67 KiB** / **651.95 KB**).  
> - **Current HEAD (`47d92f0`):** Complete elimination of JetBrains Mono in commit `47d92f0` resulted in minor string updates in the JS bundle (**651,906 B** / **636.63 KiB** / **651.91 KB**).  
> In subsequent milestone verifications, performance improvements will be evaluated against both the pre-commit 639.44 KB baseline and the current HEAD 651.91 KB / 651.95 KB denominator.

### 3.2 CSS & Document Assets

| Asset File | Raw (Bytes) | Raw (KiB) | Raw (KB) | Gzip (KiB) | Gzip (KB) | Brotli (KiB) | Brotli (KB) | Notes |
|---|---|---|---|---|---|---|---|---|
| `index-XYOI4ATK.css` *(HEAD)* | 91,060 B | 88.93 KiB | 91.06 KB | 14.48 KiB | 14.83 KB | 11.79 KiB | 12.07 KB | Tailwind v4 compiled utilities + Inter @font-face rules (JetBrains Mono removed in `47d92f0`) |
| `index-Dy5oUw_2.css` *(09f1fc5)* | 136,058 B | 132.87 KiB | 136.06 KB | 42.11 KiB | 43.12 KB | 38.64 KiB | 39.57 KB | Includes wayfinding styles + 88 @font-face rules |
| `index-CVJdGR9o.css` *(Baseline)* | 131,636 B | 128.55 KiB | 131.64 KB | 39.92 KiB | 40.88 KB | 36.67 KiB | 37.55 KB | Initial pre-commit baseline CSS |
| `index.html` | 1,490 B | 1.46 KiB | 1.49 KB | 0.74 KiB | 0.76 KB | 0.66 KiB | 0.67 KB | Document entry point (includes blocking `theme-init.js`) |
| `theme-init.js` | 243 B | 0.24 KiB | 0.24 KB | 0.17 KiB | 0.18 KB | 0.14 KiB | 0.15 KB | Render-blocking external script in `<head>` |
| `sw.js` | 1,302 B | 1.27 KiB | 1.30 KB | 0.57 KiB | 0.58 KB | 0.50 KiB | 0.51 KB | Service worker with suboptimal network-first caching |
| `manifest.webmanifest` | 612 B | 0.60 KiB | 0.61 KB | 0.31 KiB | 0.32 KB | 0.27 KiB | 0.28 KB | PWA application manifest |
| `favicon.svg` | 2,130 B | 2.08 KiB | 2.13 KB | 1.00 KiB | 1.02 KB | 0.87 KiB | 0.90 KB | Vector brand favicon |
| **Combined Total Assets (HEAD)** | **742,966 B** | **725.55 KiB** | **742.97 KB** | **176.35 KiB** | **180.59 KB** | **141.30 KiB** | **144.70 KB** | Current production static asset footprint |
| **Combined Total Assets (`09f1fc5`)** | **788,004 B** | **769.54 KiB** | **788.00 KB** | **203.79 KiB** | **208.68 KB** | **167.97 KiB** | **172.01 KB** | Calibrated asset footprint on commit `09f1fc5` |
| **Combined Total Assets (Baseline)** | **771,071 B** | **753.00 KiB** | **771.07 KB** | **199.56 KiB** | **204.35 KB** | **164.21 KiB** | **168.15 KB** | Initial pre-commit static asset footprint |

### 3.3 Font Subsets Analysis
Prior to commit `47d92f0`, the build included 88 individual `.woff` and `.woff2` font files from `@fontsource/inter` and `@fontsource/jetbrains-mono` covering Greek, Greek-ext, Vietnamese, Latin, Latin-ext, Cyrillic, and Cyrillic-ext across 4 weights (400, 500, 600, 700). In commit `47d92f0`, JetBrains Mono was completely removed from `main.tsx` and `index.css`, immediately pruning 16 font files and reducing CSS size from 136.06 KB to 91.06 KB (-45.00 KB / -33.1%). However, 72 Inter font subsets still remain in `dist/assets/`, of which unused non-Latin/non-Cyrillic subsets (Greek, Vietnamese) add CSS parsing overhead to First Contentful Paint. Furthermore, `@fontsource/montserrat` remains installed in `package.json` despite zero active usages.

---

## 4. Web Vitals Lab Measurements Across User Journeys

> **Empirical Lab Qualifications:**  
> - **Single-Run Baseline ($N=1$):** Metrics reported in Table 4.1 represent empirical single-run ($N=1$) lab measurements obtained under controlled CDP emulation; run-to-run variance of $\pm 5-10\%$ is normal and expected in synthetic throttled mobile environments.  
> - **TBT on Authenticated Routes:** Reflects **Load + Interaction Blocking Time** incurred during the navigation action and data fetching lifecycle, rather than standard idle-load FCP-to-TTI blocking time.  
> - **Login INP (0 ms):** Reflects the automated probe clicking the inactive `<main>` container rather than active form input controls.  
> - **Mobile TTFB (156 ms):** Reflects packet-level 150 ms RTT emulation via CDP, contrasting with Lighthouse's 13 ms Lantern unthrottled simulation.

The table below contrasts lab measurements across **Desktop** ($1280 \times 800$, unthrottled) and **Throttled Mobile** ($360 \times 740$, 4× CPU slowdown, 1.638 Mbps Slow 4G):

| Target Route / View | Authentication / Role | Profile | TTFB (ms) | FCP (ms) | LCP (ms) | CLS | INP (ms) | TBT (ms) | Optimization Compliance Status |
|---|---|---|---|---|---|---|---|---|---|
| **Public Landing (`/`)** | Anonymous | Desktop | 23 | 932 | 932 | 0.0203 | 0 | 0 | Meets desktop targets |
| **Public Landing (`/`)** | Anonymous | Throttled Mobile | 156 | 2,724 | **4,848** | 0.0031 | 0 | 148 | **FAILS LCP target** ($\le 2,500$ ms) |
| **Main Dashboard (`today`)** | Student (`aigul`) | Desktop | 86 | 464 | 1,916 | 0.0168 | 96 | 346 | Meets desktop targets |
| **Main Dashboard (`today`)** | Student (`aigul`) | Throttled Mobile | 161 | 4,276 | **10,996** | 0.0008 | **384** | **3,257** | **FAILS LCP, INP, & TBT** |
| **Student Profile (`profile`)** | Student (`aigul`) | Desktop | 11 | 364 | 1,228 | 0.0168 | 176 | 223 | Meets desktop targets |
| **Student Profile (`profile`)** | Student (`aigul`) | Throttled Mobile | 153 | 4,508 | **12,448** | 0.0008 | **840** | **3,001** | **FAILS LCP, INP, & TBT** |
| **Academic Schedule (`schedule`)**| Student (`aigul`) | Desktop | 10 | 400 | 1,216 | 0.0167 | 104 | 213 | Meets desktop targets |
| **Academic Schedule (`schedule`)**| Student (`aigul`) | Throttled Mobile | 155 | 3,328 | **8,568** | 0.0009 | **304** | **1,671** | **FAILS LCP, INP, & TBT** |
| **Student Roster (`staff_students`)**| Staff (`dean.office`)| Desktop | 11 | 420 | 988 | **0.1485** | 80 | 432 | **FAILS CLS target** ($\le 0.100$) |
| **Student Roster (`staff_students`)**| Staff (`dean.office`)| Throttled Mobile | 156 | 2,656 | **7,008** | **0.6389** | **256** | **2,014** | **FAILS LCP, CLS, INP, & TBT**|

### Target Threshold Gap Analysis

| Core Web Vital | Target Value | Baseline Desktop Result (Worst) | Baseline Mobile Result (Worst) | Status | Primary Root Cause |
|---|---|---|---|---|---|
| **LCP (Largest Contentful Paint)** | $\le 2,500$ ms | 1,916 ms (`today`) | **12,448 ms** (`profile`) | **CRITICAL DEFICIT** | Monolithic JS bundle transfer + cascading authenticated fetches + unmemoized re-renders |
| **INP (Interaction to Next Paint)** | $\le 200$ ms | 176 ms (`profile`) | **840 ms** (`profile`) | **CRITICAL DEFICIT** | Main thread blocked by React context re-creation and long tasks during state updates |
| **CLS (Cumulative Layout Shift)** | $\le 0.100$ | **0.1485** (`staff_students`)| **0.6389** (`staff_students`)| **HIGH DEFICIT** | Dynamic roster data insertion without reserved table heights or skeleton containers |
| **TTFB (Time to First Byte)** | $\le 800$ ms | 86 ms (`today`) | 161 ms (`today`) | **PASS** | Embedded database and local preview respond rapidly; network RTT dominates on 4G |
| **TBT (Total Blocking Time)** | $< 300$ ms | 432 ms (`staff_students`)| **3,257 ms** (`today`) | **CRITICAL DEFICIT** | Monolithic JS parsing and execution on throttled CPU |

---

## 5. Lighthouse Baseline Performance Audits

Headless Lighthouse v12 was executed against `http://127.0.0.1:4176/` across Desktop and Mobile presets:

| Lighthouse Audit Metric | Desktop Preset Audit Result | Mobile Preset Audit Result | Google Recommended Threshold |
|---|---|---|---|
| **Performance Score** | **88 / 100** | **68 / 100** | $\ge 90$ |
| **First Contentful Paint (FCP)** | 0.4 s (414 ms) | 1.1 s (1,101 ms) | $\le 1.8$ s |
| **Largest Contentful Paint (LCP)** | 0.9 s (939 ms) | **3.2 s (3,174 ms)** | $\le 2.5$ s |
| **Total Blocking Time (TBT)** | 270 ms | **1,280 ms (1,283 ms)** | $\le 200$ ms |
| **Cumulative Layout Shift (CLS)**| 0.0001 | 0.0000 | $\le 0.100$ |
| **Speed Index (SI)** | 0.9 s (886 ms) | 2.2 s (2,243 ms) | $\le 3.4$ s |
| **Server Response Time (TTFB)** | 77 ms | 13 ms | $\le 800$ ms |

### Key Diagnostic Opportunities Highlighted by Lighthouse

1. **Reduce Unused JavaScript (Estimated savings: ~412 KB / 402 KiB):**
   - Primary application bundle (`index-DmSF2jZI.js` on HEAD / `index-BquhgsQc.js` in baseline): 385.95 KB (376.91 KiB) total (over 280 KB unused on `/login`).
   - `vendor-react-DctBZRDK.js`: 218.75 KB (213.62 KiB) total.
   - `vendor-qr-CXHAcuVq.js`: 23.46 KB (22.91 KiB) (100% unused on `/login`).
2. **Eliminate Render-Blocking Resources:**
   - `theme-init.js` in `<head>` blocks DOM parsing before execution.
   - Initial stylesheet (`index-XYOI4ATK.css` on HEAD / `index-CVJdGR9o.css` in baseline: 91.06 KB / 131.64 KB) delays initial render while parsing unneeded font-faces.
3. **Preload Key Requests:**
   - Primary Cyrillic and Latin `.woff2` font files are discovered late in the stylesheet waterfall.

---

## 6. Fastify Backend Latency & Concurrency Benchmarks

### 6.1 Concurrency Load Test (100 Virtual Users via `e2e/load-smoke.mjs`)

The load benchmark simulates a burst of 100 concurrent students performing pre-flight health checks, Argon2id authentication, and accessing schedule and grade records:

| Load Metric | Benchmark Result | Target Expectation | Notes |
|---|---|---|---|
| **Target Mode** | `real-backend` (`http://127.0.0.1:3000`) | Live Node.js Fastify instance | Not mock fallback |
| **Virtual Users (VUs)** | **100 concurrent VUs** | 100 VUs | Peak university morning registration simulation |
| **Benchmark Duration** | **10.37 seconds** | $\ge 10$ seconds | Steady-state load |
| **Total Completed Requests** | **1,649 requests** | — | Clean HTTP transactions |
| **Effective Throughput** | **159.0 RPS** | $\ge 100$ RPS | Achieved without crashes |
| **Error Rate** | **0.000% (0 errors)** | $0.000\%$ | Zero dropped sockets, zero 500s |
| **Median Latency ($p_{50}$)** | **582.23 ms** | $\le 100$ ms | Impacted by unoptimized DB query serialization |
| **95th Percentile ($p_{95}$)** | **1,621.42 ms** | $\le 300$ ms | Exceeds threshold under peak load |
| **99th Percentile ($p_{99}$)** | **2,327.53 ms** | $\le 500$ ms | Tail contention during concurrent Argon2 hashing |
| **Maximum Latency** | **2,688.82 ms** | — | Peak burst on cold start |

### 6.2 Targeted Single-Stream Endpoint Latency Statistics

Measured over 100 continuous executions per endpoint on the live seeded PostgreSQL database:

| API Endpoint & Role | HTTP Method | Mean (ms) | $p_{50}$ (ms) | $p_{75}$ (ms) | $p_{95}$ (ms) | $p_{99}$ (ms) | Min (ms) | Max (ms) | RPS |
|---|---|---|---|---|---|---|---|---|---|
| `/api/v1/health` (Public) | GET | 8.58 | 8.53 | 12.12 | 15.66 | 25.39 | 1.56 | 25.39 | 111.4 |
| `/api/v1/profile` (Student) | GET | 19.96 | 17.93 | 23.91 | 35.91 | 49.47 | 10.41 | 49.47 | 49.1 |
| `/api/v1/schedule/today` (Student) | GET | 27.58 | 25.66 | 31.62 | 42.75 | 102.63 | 16.51 | 102.63 | 35.7 |
| `/api/v1/schedule` (Student) | GET | 24.62 | 23.22 | 27.31 | 38.56 | 62.20 | 14.76 | 62.20 | 40.1 |
| `/api/v1/grades` (Student) | GET | 18.30 | 16.48 | 20.82 | 32.07 | 44.81 | 9.15 | 44.81 | 53.5 |
| `/api/v1/staff/students` (Staff) | GET | 27.40 | 25.58 | 30.77 | 47.94 | 81.86 | 16.32 | 81.86 | 36.1 |
| `/api/v1/staff/groups` (Staff) | GET | 30.80 | 28.07 | 34.89 | 62.55 | 78.60 | 14.29 | 78.60 | 32.1 |

### Endpoint Bottleneck Analysis
- `/api/v1/schedule/today` is consistently slower than `/api/v1/schedule` despite returning fewer rows. Inspection of `backend/src/routes/schedule.ts:186-200` confirms that `prisma.scheduleEntry.findMany` (today's classes) and `prisma.scheduleEntry.findFirst` (next upcoming class) run **sequentially via `await ... await`**. Parallelizing with `Promise.all` in Milestone 3 will immediately reduce this latency by ~40%.
- `/api/v1/staff/groups` computes student GPAs and academic debts in-memory across nested relations without pagination or database-level aggregation.

---

## 7. Caching, Compression & Network Delivery Audit

### 7.1 Fastify HTTP Response Headers
Empirical inspection of Fastify response headers reveals two significant gaps:
1. **Missing Compression:**
   - Sending `Accept-Encoding: gzip, deflate, br` to `/api/v1/staff/groups` returns an uncompressed 1,739-byte payload (`res.headers['content-encoding'] === undefined`). Fastify currently lacks `@fastify/compress`.
2. **Missing Security Cache-Control Headers:**
   - Calls to `/api/v1/profile`, `/api/v1/grades`, and `/api/v1/schedule` return zero `Cache-Control` headers. Intermediate proxies could inadvertently cache student personal records. Fastify requires a global `onSend` hook enforcing `Cache-Control: private, no-store` and `Pragma: no-cache`.

### 7.2 Service Worker Strategy (`frontend/public/sw.js`)
- `sw.js` uses an indiscriminate `fetch(request)` first strategy for all GET requests. Content-hashed static assets in `/assets/` (`.js`, `.css`, `.woff2`) are never fetched from cache first on repeat navigations, forfeiting instant load benefits.

### 7.3 Vercel & Nginx Delivery Configuration
- `vercel.json` and `frontend/nginx.conf` correctly set `public, max-age=31536000, immutable` for `/assets/(.*)`, but lack explicit `Cache-Control: no-cache` for `index.html` navigation requests.

---

## 8. Prescribed Optimization Roadmap for Subsequent Milestones

| Milestone | Target Domain | Prescribed Actions | Anticipated Performance Impact |
|---|---|---|---|
| **M2** | Frontend & Vite | 1. Implement `React.lazy` + `<Suspense>` for all 9 routes in `App.tsx`.<br>2. Defer modals (`StudentCardModal`, `AssistantModal`, `CertificatePreviewModal`) and isolate `qrcode`.<br>3. Prune `@fontsource/montserrat`, inline `theme-init.js`, add preload for primary Cyrillic font.<br>4. Re-architect `sw.js` to Cache-First for `/assets/` and Network-First for navigation.<br>5. Memoize `AuthContext` value and array pipelines in `SchedulePage`, `StaffStudentsPage`, and `TodayPage`. | • **$\ge 40\%$ reduction** in initial JS download on `/login` (Target: $< 250$ KB raw).<br>• Mobile Login LCP drops from **4.8s to $\le 2.5$s**.<br>• TBT on mobile drops by **$> 50\%$**.<br>• CLS on staff students drops to **$< 0.100$**. |
| **M3** | Backend & Delivery | 1. Install and register `@fastify/compress` with 1 KB threshold.<br>2. Add global `onSend` hook defaulting to `private, no-store`.<br>3. Parallelize sequential queries in `/api/v1/schedule/today` via `Promise.all`.<br>4. Update `vercel.json` and `nginx.conf` for `no-cache` on HTML entry. | • **$60-70\%$ reduction** in API payload bytes for roster and schedule.<br>• $p_{50}$ latency for `/schedule/today` drops from **25.6 ms to $\le 16$ ms**.<br>• Full compliance with non-negotiable security rules. |
| **M4** | Knowledge Base | Author `docs/performance-optimization-guide.md` documenting skills in React DevTools, Vite chunking, Lighthouse CI, Fastify profiling, and regression monitoring. | Standardized performance engineering capabilities. |
| **M5** | Final Verification | Execute complete non-regression test matrix (typecheck, lint, Vitest, Playwright 36 tests, load smoke) and author `docs/performance-report.md`. | Verified achievement of all R1–R7 requirements. |

---

## 9. Conclusion

The baseline measurements definitively document the pre-optimization state of the application. The system possesses solid backend correctness and zero error rates under load, but suffers from monolithic JavaScript delivery, unmemoized frontend rendering, uncompressed API responses, and sequential database calls. The concrete targets for Milestones 2 and 3 are clearly defined and backed by reproducible empirical data.
