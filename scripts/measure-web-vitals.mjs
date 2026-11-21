import { chromium } from '../e2e/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_URL = 'http://127.0.0.1:4176';
const BACKEND_URL = 'http://127.0.0.1:3000';

async function getAuthCookie(email, password) {
  const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const setCookie = res.headers.get('set-cookie');
  const match = setCookie.match(/dean_session=([^;]+)/);
  return match ? match[1] : null;
}

const OBSERVER_SCRIPT = `
window.__vitals = {
  ttfb: 0,
  fcp: 0,
  lcp: 0,
  cls: 0,
  tbt: 0,
  inp: 0,
  longtasks: []
};

// Layout shift
try {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        window.__vitals.cls += entry.value;
      }
    }
  }).observe({ type: 'layout-shift', buffered: true });
} catch {}

// LCP
try {
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    if (entries.length > 0) {
      window.__vitals.lcp = entries[entries.length - 1].startTime;
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
} catch {}

// Long tasks for TBT
try {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__vitals.longtasks.push({
        start: entry.startTime,
        duration: entry.duration
      });
    }
  }).observe({ type: 'longtask', buffered: true });
} catch {}

// Event timing for INP
try {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const duration = entry.duration;
      if (duration > window.__vitals.inp) {
        window.__vitals.inp = duration;
      }
    }
  }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
} catch {}
`;

async function measurePage(browser, profile, routeConfig) {
  const isMobile = profile === 'mobile';
  const contextOptions = isMobile
    ? {
        viewport: { width: 360, height: 740 },
        userAgent:
          'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      }
    : {
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      };

  const context = await browser.newContext(contextOptions);

  if (routeConfig.cookie) {
    await context.addCookies([
      {
        name: 'dean_session',
        value: routeConfig.cookie,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
  }

  const page = await context.newPage();

  // If mobile, apply network & CPU throttling via CDP
  if (isMobile) {
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150, // 150 ms RTT
      downloadThroughput: Math.floor((1.638 * 1024 * 1024) / 8), // 1.638 Mbps
      uploadThroughput: Math.floor((750 * 1024) / 8), // 750 Kbps
      connectionType: 'cellular4g',
    });
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }

  await page.addInitScript(OBSERVER_SCRIPT);

  const t0 = performance.now();
  await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'load' });

  // If action needed (e.g. click tab)
  if (routeConfig.action) {
    await routeConfig.action(page, isMobile);
  }

  // Wait for network settle / animations
  await page.waitForTimeout(isMobile ? 2500 : 1500);

  // Trigger a sample interaction to measure INP if not present
  try {
    const target = page.locator('main').first();
    if (await target.count()) {
      await target.click({ timeout: 1000 }).catch(() => {});
    }
  } catch {}

  await page.waitForTimeout(500);

  const metrics = await page.evaluate(() => {
    const navEntries = performance.getEntriesByType('navigation');
    const nav = navEntries.length > 0 ? navEntries[0] : null;
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((p) => p.name === 'first-contentful-paint');

    const fcp = fcpEntry ? fcpEntry.startTime : 0;
    const ttfb = nav ? nav.responseStart : 0;
    const lcp = window.__vitals.lcp || fcp;
    const cls = window.__vitals.cls;

    // Calculate TBT: sum of (duration - 50) for long tasks after FCP
    let tbt = 0;
    for (const task of window.__vitals.longtasks) {
      if (task.start >= fcp || task.start + task.duration >= fcp) {
        if (task.duration > 50) {
          tbt += task.duration - 50;
        }
      }
    }

    const inp = window.__vitals.inp;

    return {
      ttfb: Math.round(ttfb),
      fcp: Math.round(fcp),
      lcp: Math.round(lcp),
      cls: +cls.toFixed(4),
      tbt: Math.round(tbt),
      inp: Math.round(inp),
    };
  });

  await context.close();
  return metrics;
}

async function main() {
  console.log('[measure] Starting genuine Web Vitals measurement...');
  const browser = await chromium.launch({ headless: true });

  const studentCookie = await getAuthCookie('aigul.nurova@demo.edu', 'DemoStudent123!');
  const staffCookie = await getAuthCookie('dean.office@demo.edu', 'DemoStaff123!');

  const routes = [
    {
      id: 'login',
      name: 'Public Landing / Login Page',
      cookie: null,
      action: async (page) => {
        await page.waitForSelector('input[placeholder="student@demo.edu"]');
      },
    },
    {
      id: 'dashboard',
      name: 'Main Dashboard (Today)',
      cookie: studentCookie,
      action: async (page) => {
        await page.waitForSelector('main');
        await page.locator('main').getByText(/Айгуль|Здравствуйте/i).first().waitFor({ timeout: 5000 }).catch(() => {});
      },
    },
    {
      id: 'profile',
      name: 'Student Profile Page',
      cookie: studentCookie,
      action: async (page, isMobile) => {
        await page.waitForSelector('main');
        const profileBtn = page.getByRole('button', { name: /Айгуль/i }).first();
        if (await profileBtn.count()) {
          await profileBtn.click();
        } else {
          // fallback click header button
          await page.locator('header button').last().click();
        }
        await page.waitForTimeout(500);
      },
    },
    {
      id: 'schedule',
      name: 'Academic Schedule Page',
      cookie: studentCookie,
      action: async (page, isMobile) => {
        await page.waitForSelector('main');
        if (isMobile) {
          await page.locator('nav.fixed button', { hasText: /Расписание|Timetable/i }).click();
        } else {
          await page.locator('aside button', { hasText: /Расписание и сессия/i }).click();
        }
        await page.waitForTimeout(500);
      },
    },
    {
      id: 'staff_students',
      name: 'Student Roster (Staff)',
      cookie: staffCookie,
      action: async (page, isMobile) => {
        await page.waitForSelector('main');
        if (isMobile) {
          await page.locator('nav.fixed button', { hasText: /Группы/i }).click();
        } else {
          await page.locator('aside button', { hasText: /Группы и студенты/i }).click();
        }
        await page.waitForTimeout(500);
      },
    },
  ];

  const results = { desktop: {}, mobile: {} };

  console.log('--- Measuring Desktop (1280x800, Unthrottled) ---');
  for (const r of routes) {
    console.log(`Measuring Desktop: ${r.name}...`);
    results.desktop[r.id] = await measurePage(browser, 'desktop', r);
    console.log(`Result:`, results.desktop[r.id]);
  }

  console.log('--- Measuring Mobile (360x740, 4x CPU, 1.638 Mbps Slow 4G) ---');
  for (const r of routes) {
    console.log(`Measuring Mobile: ${r.name}...`);
    results.mobile[r.id] = await measurePage(browser, 'mobile', r);
    console.log(`Result:`, results.mobile[r.id]);
  }

  await browser.close();

  fs.writeFileSync('docs/web-vitals-baseline.json', JSON.stringify(results, null, 2));
  console.log('Baseline Web Vitals saved to docs/web-vitals-baseline.json');
}

main().catch((err) => {
  console.error('[measure] Error:', err);
  process.exit(1);
});
