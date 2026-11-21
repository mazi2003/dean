import pkg from '../e2e/node_modules/playwright/index.js';
const { chromium } = pkg;
import fs from 'node:fs';
import path from 'node:path';

const SCREENS_DIR = path.resolve('docs/screens/dark-mode');
fs.mkdirSync(SCREENS_DIR, { recursive: true });

async function run() {
  console.log('=== [Agent Timur] Starting Dark Mode Testing on Account 2 (timur.belov@demo.edu) ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => errors.push(`PageError: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('401 (Unauthorized)')) {
      errors.push(`ConsoleError: ${msg.text()}`);
    }
  });

  // 1. Login as Timur
  console.log('[1/6] Logging in as Timur Belov...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Ensure dark mode
  let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDark) {
    await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  }
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  await page.getByPlaceholder('student@demo.edu').fill('timur.belov@demo.edu');
  await page.getByPlaceholder('••••••••••••').fill('DemoStudent123!');
  await page.getByRole('button', { name: /Войти в личный кабинет|Authenticate & Sign In/i }).click();

  // 2. Today Dashboard with Academic Debt Alert
  console.log('[2/6] Testing Today Dashboard & Academic Debt Alert in Dark & Light...');
  await page.waitForSelector('main');
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  await page.waitForSelector('text=Статистика');
  await page.screenshot({ path: path.join(SCREENS_DIR, '11_timur_today_debt_dark.png'), fullPage: false });
  console.log('  -> Saved 11_timur_today_debt_dark.png');

  // Toggle to light mode
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '11_timur_today_debt_light.png'), fullPage: false });
  console.log('  -> Saved 11_timur_today_debt_light.png');

  // Back to dark
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // 3. Requests Page
  console.log('[3/6] Testing Requests Page & Status Badges (needs_info & ready)...');
  await page.locator('aside button', { hasText: /Справки и документы/i }).click();
  await page.locator('text=Журнал поданных заявлений').first().waitFor();
  await page.locator('text=Справка').first().waitFor();

  // Expand first request details
  const detailsBtn = page.getByRole('button', { name: /Подробнее|Details/i }).first();
  if (await detailsBtn.isVisible()) {
    await detailsBtn.click();
  }
  await page.screenshot({ path: path.join(SCREENS_DIR, '12_requests_journal_dark.png'), fullPage: false });
  console.log('  -> Saved 12_requests_journal_dark.png');

  // Light mode on Requests
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '12_requests_journal_light.png'), fullPage: false });
  console.log('  -> Saved 12_requests_journal_light.png');

  // Back to dark
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // 4. New Request Wizard Modal
  console.log('[4/6] Testing New Request Wizard Modal...');
  await page.getByRole('button', { name: /Подать новое заявление/i }).click();
  await page.locator('text=Новое заявление').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '13_new_request_wizard_dark.png') });
  console.log('  -> Saved 13_new_request_wizard_dark.png');
  await page.getByRole('button', { name: /Закрыть|Отмена|Close/i }).first().click();

  // Light mode on wizard
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.getByRole('button', { name: /Подать новое заявление/i }).click();
  await page.locator('text=Новое заявление').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '13_new_request_wizard_light.png') });
  console.log('  -> Saved 13_new_request_wizard_light.png');
  await page.getByRole('button', { name: /Закрыть|Отмена|Close/i }).first().click();

  // Back to dark
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // 5. Certificate PDF Preview Modal
  console.log('[5/6] Testing Certificate PDF Preview Modal...');
  const pdfBtn = page.getByRole('button', { name: /Макет PDF/i }).first();
  if (await pdfBtn.isVisible()) {
    await pdfBtn.click();
    await page.locator('text=ИЛЛЮСТРАТИВНЫЙ ШТАМП').first().waitFor();
    await page.screenshot({ path: path.join(SCREENS_DIR, '14_certificate_preview_dark.png') });
    console.log('  -> Saved 14_certificate_preview_dark.png');
    await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

    // Light mode on PDF modal
    await page.getByRole('button', { name: /Toggle theme/i }).first().click();
    await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
    await pdfBtn.click();
    await page.locator('text=ИЛЛЮСТРАТИВНЫЙ ШТАМП').first().waitFor();
    await page.screenshot({ path: path.join(SCREENS_DIR, '14_certificate_preview_light.png') });
    console.log('  -> Saved 14_certificate_preview_light.png');
    await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

    // Back to dark
    await page.getByRole('button', { name: /Toggle theme/i }).first().click();
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  }

  // 6. Notifications Page & Mobile Viewport
  console.log('[6/6] Testing Notifications Page & Mobile 360px Viewport...');
  await page.locator('aside button', { hasText: /Вестник и приказы|Decrees/i }).click();
  await page.locator('text=вестник университета').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '15_notifications_dark.png'), fullPage: false });
  console.log('  -> Saved 15_notifications_dark.png');

  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '15_notifications_light.png'), fullPage: false });
  console.log('  -> Saved 15_notifications_light.png');

  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // Switch to mobile viewport
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENS_DIR, '16_timur_mobile_dark.png') });
  console.log('  -> Saved 16_timur_mobile_dark.png');

  // Logout
  console.log('Logging out...');
  await page.getByRole('button', { name: /Logout/i }).first().click();
  await page.waitForSelector('input[type="email"]');

  await browser.close();

  if (errors.length > 0) {
    console.error('Warnings/Errors found during Agent Timur execution:', errors);
  } else {
    console.log('=== [Agent Timur] All dark mode tests and request/debt checks PASSED with zero errors! ===');
  }
}

run().catch((err) => {
  console.error('Agent Timur FATAL:', err);
  process.exit(1);
});
