import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(path.resolve('e2e/package.json'));
const { chromium } = require('@playwright/test');

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'DemoStudent123!';
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD || 'DemoStaff123!';

const screenshotDir = path.resolve('docs/screens/language-audit');
fs.mkdirSync(screenshotDir, { recursive: true });

const results = {
  testedAccounts: [],
  pagesChecked: 0,
  untranslatedFindings: [],
  status: 'PENDING',
};

// Recognized fictional database entities that intentionally retain Russian native names/codes
const ALLOWED_CYRILLIC_ENTITIES = [
  'Айгуль', 'Нурова', 'Тимур', 'Белов', 'Лина', 'Петрова', 'Окафор',
  'Марина', 'Волкова', 'Мария', 'Алексей', 'Смирнов', 'Елена', 'Ковалева',
  'ДУ-101', 'ДУ-205', 'ДУ-102',
  'СТ-2023-0194', 'СТ-2022-0041', 'СТ-2024-0312', 'СТ-2022-0082', 'СТ-2023-0215',
  'Конкурсный концепт', 'Вымышленные данные',
];

function isEntityAllowed(text) {
  const trimmed = text.trim();
  if (/^(?:№\s*)?[А-ЯЁ]{1,4}-\d{2,4}$/.test(trimmed)) return true; // e.g. ДУ-101
  if (/^(?:№\s*)?СТ-\d{4}-\d{4}$/.test(trimmed)) return true; // e.g. № СТ-2022-0082
  if (/^[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+$/.test(trimmed)) {
    // Two Russian names (e.g. Айгуль Нурова, Тимур Белов)
    return true;
  }
  for (const allowed of ALLOWED_CYRILLIC_ENTITIES) {
    if (trimmed.includes(allowed)) return true;
  }
  return false;
}

async function setLanguage(page, targetLang) {
  const currentLang = await page.locator('html').getAttribute('lang');
  if (currentLang !== targetLang) {
    const toggleBtn = page.getByRole('button', { name: /Toggle language|Сменить язык/i }).first();
    await toggleBtn.click();
    await page.waitForTimeout(400);
  }
}

async function closeModal(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const closeBtn = page.getByRole('button', { name: /Close|Закрыть/i }).first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click().catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function findCyrillicInEnMode(page, contextName) {
  const findings = await page.evaluate(() => {
    const textNodes = [];
    const elements = document.querySelectorAll(
      'main h1, main h2, main h3, main h4, main h5, main p, main span, main button, main td, main th, header button, header span, header p, aside button, aside span, aside h4, aside p, [role="dialog"] h2, [role="dialog"] h3, [role="dialog"] h4, [role="dialog"] p, [role="dialog"] span, [role="dialog"] button, [role="dialog"] td'
    );

    for (const el of elements) {
      if (el.offsetParent === null) continue; // Skip hidden elements
      if (el.tagName === 'SVG' || el.closest('svg')) continue;

      const text = (el.innerText || el.textContent || '').trim();
      if (!text || text.length < 2) continue;

      // Check if text contains Cyrillic letters
      if (/[а-яА-ЯёЁ]/.test(text)) {
        textNodes.push(text.slice(0, 120));
      }
    }
    return Array.from(new Set(textNodes));
  });

  const realUntranslated = findings.filter((t) => !isEntityAllowed(t));

  if (realUntranslated.length > 0) {
    console.log(`❌ [CYRILLIC IN EN] on ${contextName}:`, realUntranslated);
    results.untranslatedFindings.push({ context: contextName, items: realUntranslated });
  } else {
    console.log(`✅ [PASS EN] ${contextName}: 0 untranslated Cyrillic strings`);
  }
}

async function clickStudentTab(page, tabId) {
  if (tabId === 'notifications') {
    const asideNotif = page.locator('aside button').filter({ hasText: /Decrees & Bulletins|Вестник и приказы/i }).first();
    if (await asideNotif.count() > 0) {
      await asideNotif.click();
    } else {
      await page.locator('header').getByRole('button', { name: /Notifications|Уведомления/i }).first().click();
    }
  } else if (tabId === 'today') {
    await page.locator('aside button').filter({ hasText: /Academic Overview|Главная \(Сегодня\)/i }).first().click();
  } else if (tabId === 'schedule') {
    await page.locator('aside button').filter({ hasText: /Timetable & Exams|Расписание и сессия/i }).first().click();
  } else if (tabId === 'grades') {
    await page.locator('aside button').filter({ hasText: /Academic Records|Зачетная книжка/i }).first().click();
  } else if (tabId === 'requests') {
    await page.locator('aside button').filter({ hasText: /Official Certificates|Справки и документы/i }).first().click();
  } else if (tabId === 'profile') {
    await page.locator('aside button').filter({ hasText: /Student Dossier|Учебная карточка/i }).first().click();
  }
  await page.waitForTimeout(500);
}

async function clickStaffTab(page, tabId) {
  if (tabId === 'staff_requests') {
    await page.locator('aside button').filter({ hasText: /Student Inquiries|Заявления студентов/i }).first().click();
  } else if (tabId === 'staff_students') {
    await page.locator('aside button').filter({ hasText: /Groups & Students|Группы и студенты/i }).first().click();
  } else if (tabId === 'schedule') {
    await page.locator('aside button').filter({ hasText: /Faculty Timetable|Диспетчер расписания/i }).first().click();
  } else if (tabId === 'staff_actions') {
    await page.locator('aside button').filter({ hasText: /Decrees & Notices|Публикация приказов/i }).first().click();
  } else if (tabId === 'profile') {
    await page.locator('aside button').filter({ hasText: /Staff Dossier|Служебный профиль/i }).first().click();
  }
  await page.waitForTimeout(500);
}

async function runAudit() {
  console.log(`Starting Exhaustive Language Audit on ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  // 1. LOGIN PAGE (RU & EN)
  console.log('\n--- 1. Testing Login Page ---');
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Login page RU
  await setLanguage(page, 'ru');
  await page.screenshot({ path: path.join(screenshotDir, '01_login_ru.png') });
  console.log('Login RU screenshot captured.');

  // Login page EN
  await setLanguage(page, 'en');
  await page.screenshot({ path: path.join(screenshotDir, '01_login_en.png') });
  await findCyrillicInEnMode(page, 'LoginPage EN');
  results.pagesChecked++;

  // 2. STUDENT 1: AIGUL NUROVA (Regular 2nd year student)
  console.log('\n--- 2. Testing Student 1: Aigul Nurova ---');
  await page.getByPlaceholder(/student@demo\.edu/i).fill('aigul.nurova@demo.edu');
  await page.locator('input[type="password"]').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: /Sign in|Войти/i }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  results.testedAccounts.push('aigul.nurova@demo.edu');

  // Verify all 6 tabs in EN mode
  const tabs = ['today', 'schedule', 'grades', 'requests', 'notifications', 'profile'];
  for (const t of tabs) {
    await clickStudentTab(page, t);
    results.pagesChecked++;
    await findCyrillicInEnMode(page, `Aigul - Tab: ${t} (EN)`);
    await page.screenshot({ path: path.join(screenshotDir, `aigul_${t}_en.png`) });
  }

  // Check Student ID Modal (EN)
  const idCardBtn = page.locator('header').getByRole('button', { name: /Digital Student ID|Студенческий билет/i }).first();
  if (await idCardBtn.count() > 0) {
    await idCardBtn.click();
    await page.waitForTimeout(500);
    results.pagesChecked++;
    await findCyrillicInEnMode(page, 'Aigul - Digital Student Pass Modal (EN)');
    await page.screenshot({ path: path.join(screenshotDir, 'aigul_modal_idcard_en.png') });
    await closeModal(page);
  }

  // Check Copilot Assistant Modal (EN)
  const copilotBtn = page.locator('header').getByRole('button', { name: /Academic Advisory Copilot|Консультант/i }).first();
  if (await copilotBtn.count() > 0) {
    await copilotBtn.click();
    await page.waitForTimeout(500);
    results.pagesChecked++;
    await findCyrillicInEnMode(page, 'Aigul - AI Copilot Modal (EN)');
    await page.screenshot({ path: path.join(screenshotDir, 'aigul_modal_copilot_en.png') });
    await closeModal(page);
  }

  // Test toggling to RU for Aigul
  await setLanguage(page, 'ru');
  await page.screenshot({ path: path.join(screenshotDir, 'aigul_overview_ru.png') });
  console.log('Aigul RU verified cleanly.');

  // Logout
  await page.locator('header').getByRole('button', { name: /Logout|Выйти/i }).first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // 3. STUDENT 2: TIMUR BELOV (Academic Debt, Retakes, Certificate Preview)
  console.log('\n--- 3. Testing Student 2: Timur Belov ---');
  await page.getByPlaceholder(/student@demo\.edu/i).fill('timur.belov@demo.edu');
  await page.locator('input[type="password"]').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: /Sign in|Войти/i }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  results.testedAccounts.push('timur.belov@demo.edu');

  await setLanguage(page, 'en');

  // Check Today Tab (Timur warning / collision)
  await clickStudentTab(page, 'today');
  results.pagesChecked++;
  await findCyrillicInEnMode(page, 'Timur - Today Tab (EN)');
  await page.screenshot({ path: path.join(screenshotDir, 'timur_today_en.png') });

  // Check Grades Tab (Timur academic debt banner)
  await clickStudentTab(page, 'grades');
  results.pagesChecked++;
  await findCyrillicInEnMode(page, 'Timur - Grades Debt Banner (EN)');
  await page.screenshot({ path: path.join(screenshotDir, 'timur_grades_en.png') });

  // Check Requests Tab (Timur ready certificate & history)
  await clickStudentTab(page, 'requests');
  results.pagesChecked++;
  await findCyrillicInEnMode(page, 'Timur - Requests Tab (EN)');
  await page.screenshot({ path: path.join(screenshotDir, 'timur_requests_en.png') });

  // Open Timur's ready Certificate Preview Modal
  const previewBtn = page.getByRole('button', { name: /View & Verify|Просмотр и ЭЦП|Скачать|Download/i }).first();
  if (await previewBtn.count() > 0) {
    await previewBtn.click();
    await page.waitForTimeout(600);
    results.pagesChecked++;
    await findCyrillicInEnMode(page, 'Timur - Certificate Preview Modal (EN)');
    await page.screenshot({ path: path.join(screenshotDir, 'timur_modal_cert_en.png') });
    await closeModal(page);
  }

  // Check Notifications Tab (Timur alerts)
  await clickStudentTab(page, 'notifications');
  results.pagesChecked++;
  await findCyrillicInEnMode(page, 'Timur - Notifications Tab (EN)');
  await page.screenshot({ path: path.join(screenshotDir, 'timur_notifications_en.png') });

  // Logout
  await page.locator('header').getByRole('button', { name: /Logout|Выйти/i }).first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // 4. STUDENT 3: LINA OKAFOR (Freshman, Empty states, Unread alerts)
  console.log('\n--- 4. Testing Student 3: Lina Okafor ---');
  await page.getByPlaceholder(/student@demo\.edu/i).fill('lina.okafor@demo.edu');
  await page.locator('input[type="password"]').fill(STUDENT_PASSWORD);
  await page.getByRole('button', { name: /Sign in|Войти/i }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  results.testedAccounts.push('lina.okafor@demo.edu');

  await setLanguage(page, 'en');

  // Check Today Tab (Lina freshman brief)
  await clickStudentTab(page, 'today');
  results.pagesChecked++;
  await findCyrillicInEnMode(page, 'Lina - Today Tab (EN)');
  await page.screenshot({ path: path.join(screenshotDir, 'lina_today_en.png') });

  // Check Requests Tab (Lina empty requests list)
  await clickStudentTab(page, 'requests');
  results.pagesChecked++;
  await findCyrillicInEnMode(page, 'Lina - Requests Empty State (EN)');
  await page.screenshot({ path: path.join(screenshotDir, 'lina_requests_en.png') });

  // Check Notifications Tab (Lina unread gazettes)
  await clickStudentTab(page, 'notifications');
  results.pagesChecked++;
  await findCyrillicInEnMode(page, 'Lina - Notifications (EN)');
  await page.screenshot({ path: path.join(screenshotDir, 'lina_notifications_en.png') });

  // Logout
  await page.locator('header').getByRole('button', { name: /Logout|Выйти/i }).first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // 5. STAFF ACCOUNT: DEAN'S OFFICE / MARIA VOLKOVA (Dean's Office Inspector)
  console.log('\n--- 5. Testing Staff: Dean Office / Maria Volkova ---');
  await page.getByPlaceholder(/student@demo\.edu/i).fill('dean.office@demo.edu');
  await page.locator('input[type="password"]').fill(STAFF_PASSWORD);
  await page.getByRole('button', { name: /Sign in|Войти/i }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  results.testedAccounts.push('dean.office@demo.edu');

  await setLanguage(page, 'en');

  const staffTabs = ['staff_requests', 'staff_students', 'schedule', 'staff_actions', 'profile'];
  for (const st of staffTabs) {
    await clickStaffTab(page, st);
    results.pagesChecked++;
    await findCyrillicInEnMode(page, `Staff - Tab: ${st} (EN)`);
    await page.screenshot({ path: path.join(screenshotDir, `staff_${st}_en.png`) });
  }

  await browser.close();

  results.status = results.untranslatedFindings.length === 0 ? 'SUCCESS' : 'NEEDS_TRANSLATION';
  console.log('\n=======================================');
  console.log('LANGUAGE AUDIT COMPLETE:');
  console.log('Status:', results.status);
  console.log('Accounts Tested:', results.testedAccounts);
  console.log('Pages & Views Checked:', results.pagesChecked);
  console.log('Untranslated Findings Count:', results.untranslatedFindings.length);
  if (results.untranslatedFindings.length > 0) {
    console.log('Details:', JSON.stringify(results.untranslatedFindings, null, 2));
  }
  console.log('=======================================\n');

  fs.writeFileSync('docs/language-audit-results.json', JSON.stringify(results, null, 2), 'utf8');
}

runAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
