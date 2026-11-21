import pkg from '../e2e/node_modules/playwright/index.js';
const { chromium } = pkg;
import fs from 'node:fs';
import path from 'node:path';

const SCREENS_DIR = path.resolve('docs/screens/dark-mode');
fs.mkdirSync(SCREENS_DIR, { recursive: true });

async function run() {
  console.log('=== [Agent Aigul] Starting Dark Mode Testing on Account 1 (aigul.nurova@demo.edu) ===');
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

  // 1. Login Page
  console.log('[1/7] Testing Login Page theme toggling...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Verify initial state or ensure dark mode
  let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDark) {
    await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  }
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '01_login_dark.png') });
  console.log('  -> Saved 01_login_dark.png');

  // Toggle to light mode
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '01_login_light.png') });
  console.log('  -> Saved 01_login_light.png');

  // Toggle back to dark mode
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // 2. Perform Login as Aigul
  console.log('[2/7] Logging in as Aigul Nurova...');
  await page.getByPlaceholder('student@demo.edu').fill('aigul.nurova@demo.edu');
  await page.getByPlaceholder('••••••••••••').fill('DemoStudent123!');
  await page.getByRole('button', { name: /Войти в личный кабинет|Authenticate & Sign In/i }).click();

  // 3. Today Dashboard
  console.log('[3/7] Testing Today Dashboard in Dark & Light Mode...');
  await page.waitForSelector('main');
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '02_today_dark.png'), fullPage: false });
  console.log('  -> Saved 02_today_dark.png');

  // Toggle to light on Today page
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '02_today_light.png'), fullPage: false });
  console.log('  -> Saved 02_today_light.png');

  // Toggle back to dark
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // 4. Schedule Page
  console.log('[4/7] Testing Schedule Page (Day, Week, Exams)...');
  await page.locator('aside button', { hasText: /Расписание и сессия/i }).click();
  await page.waitForSelector('text=Дипломатический протокол');
  await page.screenshot({ path: path.join(SCREENS_DIR, '03_schedule_day_dark.png'), fullPage: false });
  console.log('  -> Saved 03_schedule_day_dark.png');

  // Week View
  await page.getByRole('button', { name: /Вся неделя/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENS_DIR, '04_schedule_week_dark.png'), fullPage: false });
  console.log('  -> Saved 04_schedule_week_dark.png');

  // Exams View
  await page.locator('main').getByRole('button', { name: /Экзаменационная сессия|Экзамены/i }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENS_DIR, '05_schedule_exams_dark.png'), fullPage: false });
  console.log('  -> Saved 05_schedule_exams_dark.png');

  // Light mode on Exams
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '05_schedule_exams_light.png'), fullPage: false });
  console.log('  -> Saved 05_schedule_exams_light.png');

  // Back to dark
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // 5. Grades Page
  console.log('[5/7] Testing Grades Page...');
  await page.locator('aside button', { hasText: /Зачетная книжка/i }).click();
  await page.locator('text=Средний балл').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '06_grades_dark.png'), fullPage: false });
  console.log('  -> Saved 06_grades_dark.png');

  // Light mode on Grades
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '06_grades_light.png'), fullPage: false });
  console.log('  -> Saved 06_grades_light.png');

  // Back to dark
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // 6. Profile Page
  console.log('[6/7] Testing Profile Page...');
  await page.locator('aside button', { hasText: /Учебная карточка|Профиль|Student Dossier/i }).click();
  await page.waitForSelector('text=ДУ-101');
  await page.screenshot({ path: path.join(SCREENS_DIR, '07_profile_dark.png'), fullPage: false });
  console.log('  -> Saved 07_profile_dark.png');

  // 7. Modals: Student Card, AI Assistant, Campus Map
  console.log('[7/7] Testing Modals in Dark Mode...');

  // Student Card Modal
  await page.getByRole('button', { name: /Электронный студенческий билет|Digital Student ID/i }).first().click();
  await page.waitForSelector('text=симуляция NFC / QR-пропуска');
  await page.screenshot({ path: path.join(SCREENS_DIR, '08_student_card_dark.png') });
  console.log('  -> Saved 08_student_card_dark.png');

  // Flip / NFC test
  await page.getByRole('button', { name: /Приложить к турникету \(Симуляция NFC\)/i }).click();
  await page.waitForSelector('text=Проход через турникет разрешен');
  await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

  // AI Assistant Modal
  await page.getByRole('button', { name: /Консультант|Copilot/i }).first().click();
  await page.waitForSelector('text=Часы приема и контакты деканата?');
  await page.getByRole('button', { name: /Часы приема и контакты деканата\?/i }).click();
  await page.waitForSelector('text=кабинет 312');
  await page.screenshot({ path: path.join(SCREENS_DIR, '09_copilot_dark.png') });
  console.log('  -> Saved 09_copilot_dark.png');
  await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

  // Re-check Copilot in light mode
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.getByRole('button', { name: /Консультант|Copilot/i }).first().click();
  await page.waitForSelector('text=Консультант деканата');
  await page.screenshot({ path: path.join(SCREENS_DIR, '09_copilot_light.png') });
  console.log('  -> Saved 09_copilot_light.png');
  await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

  // Return to dark mode
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // Campus Map Modal (from Today page room tag)
  await page.locator('aside button', { hasText: /Главная/i }).click();
  await page.locator('text=Расписание на сегодня').first().waitFor();
  const mapTrigger = page.locator('button[title*="карте"]').first();
  if (await mapTrigger.isVisible()) {
    await mapTrigger.click();
    await page.locator('text=Интерактивная карта').first().waitFor();
    await page.screenshot({ path: path.join(SCREENS_DIR, '10_campus_map_dark.png') });
    console.log('  -> Saved 10_campus_map_dark.png');
    await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

    // Re-check Campus Map in light mode
    await page.getByRole('button', { name: /Toggle theme/i }).first().click();
    await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
    await mapTrigger.click();
    await page.locator('text=Интерактивная карта').first().waitFor();
    await page.screenshot({ path: path.join(SCREENS_DIR, '10_campus_map_light.png') });
    console.log('  -> Saved 10_campus_map_light.png');
    await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

    // Back to dark
    await page.getByRole('button', { name: /Toggle theme/i }).first().click();
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  }

  // Logout
  console.log('Logging out...');
  await page.getByRole('button', { name: /Logout/i }).click();
  await page.waitForSelector('input[type="email"]');

  await browser.close();

  if (errors.length > 0) {
    console.error('Warnings/Errors found during Agent Aigul execution:', errors);
  } else {
    console.log('=== [Agent Aigul] All dark mode tests and modal checks PASSED with zero errors! ===');
  }
}

run().catch((err) => {
  console.error('Agent Aigul FATAL:', err);
  process.exit(1);
});
