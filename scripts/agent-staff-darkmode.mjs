import pkg from '../e2e/node_modules/playwright/index.js';
const { chromium } = pkg;
import fs from 'node:fs';
import path from 'node:path';

const SCREENS_DIR = path.resolve('docs/screens/dark-mode');
fs.mkdirSync(SCREENS_DIR, { recursive: true });

async function run() {
  console.log('=== [Agent Staff] Starting Dark Mode Testing on Account 3 (dean.office@demo.edu) ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
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

  // 1. Login as Staff
  console.log('[1/6] Logging in as Staff (Maria Volkova)...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Ensure dark mode
  let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDark) {
    await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  }
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  await page.getByPlaceholder('student@demo.edu').fill('dean.office@demo.edu');
  await page.getByPlaceholder('••••••••••••').fill('DemoStaff123!');
  const [loginRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes('/api/v1/auth/login')),
    page.getByRole('button', { name: /Войти в личный кабинет|Authenticate & Sign In/i }).click(),
  ]);
  console.log('Staff login response:', loginRes.status(), await loginRes.text());

  // 2. Staff Dean Registry Dashboard
  console.log('[2/6] Testing Staff Dashboard in Dark & Light Mode...');
  await page.waitForSelector('main');
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  await page.locator('text=Заявления и документы студентов').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '17_staff_dashboard_dark.png'), fullPage: false });
  console.log('  -> Saved 17_staff_dashboard_dark.png');

  // Light mode on Staff Dashboard
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '17_staff_dashboard_light.png'), fullPage: false });
  console.log('  -> Saved 17_staff_dashboard_light.png');

  // Back to dark
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // 3. Announcement Creator Form
  console.log('[3/6] Testing Announcement Composer Form in Dark & Light Mode...');
  const createAnnBtn = page.getByRole('button', { name: /Создать объявление|New Announcement/i }).first();
  if (await createAnnBtn.isVisible()) {
    // Open in Dark Mode
    await createAnnBtn.click();
    await page.locator('text=Публикация официального распоряжения').first().waitFor();
    await page.screenshot({ path: path.join(SCREENS_DIR, '18_staff_announcement_form_dark.png') });
    console.log('  -> Saved 18_staff_announcement_form_dark.png');
    // Close modal
    await page.getByRole('button', { name: /Отмена|Cancel/i }).first().click();
    await page.locator('text=Публикация официального распоряжения').waitFor({ state: 'detached' });

    // Switch to Light Mode
    await page.getByRole('button', { name: /Toggle theme/i }).first().click();
    await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));

    // Open in Light Mode
    await createAnnBtn.click();
    await page.locator('text=Публикация официального распоряжения').first().waitFor();
    await page.screenshot({ path: path.join(SCREENS_DIR, '18_staff_announcement_form_light.png') });
    console.log('  -> Saved 18_staff_announcement_form_light.png');
    // Close modal
    await page.getByRole('button', { name: /Отмена|Cancel/i }).first().click();
    await page.locator('text=Публикация официального распоряжения').waitFor({ state: 'detached' });

    // Back to Dark Mode
    await page.getByRole('button', { name: /Toggle theme/i }).first().click();
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
  }

  // 4. Groups & Students Page
  console.log('[4/6] Testing Groups & Students Page...');
  await page.locator('aside button', { hasText: /Группы и студенты|Groups & Students/i }).click();
  await page.locator('text=Академические группы факультета').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '19_staff_students_dark.png'), fullPage: false });
  console.log('  -> Saved 19_staff_students_dark.png');

  // Light Mode on Groups & Students
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));
  await page.screenshot({ path: path.join(SCREENS_DIR, '19_staff_students_light.png'), fullPage: false });
  console.log('  -> Saved 19_staff_students_light.png');

  // 5. Student Dossier Modal & Official Transcript Modal
  console.log('[5/6] Testing Student Dossier & Transcript Modals...');
  // Open Dossier in Light Mode
  await page.locator('button', { hasText: /Личное дело|Student Dossier/i }).first().click();
  await page.locator('[role="dialog"]').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '20_student_dossier_light.png') });
  console.log('  -> Saved 20_student_dossier_light.png');

  // Open Transcript in Light Mode
  const transcriptBtnLight = page.getByRole('button', { name: /Сформировать выписку успеваемости|Generate Academic Transcript/i }).first();
  if (await transcriptBtnLight.isVisible()) {
    await transcriptBtnLight.click();
    await page.locator('text=Макет выписки').first().waitFor();
    await page.screenshot({ path: path.join(SCREENS_DIR, '21_official_transcript_light.png') });
    console.log('  -> Saved 21_official_transcript_light.png');
    await page.locator('[role="dialog"]').last().getByRole('button', { name: /Закрыть|Close/i }).first().click();
    await page.locator('text=Макет выписки').waitFor({ state: 'detached' });
  }

  // Close Dossier in Light Mode
  await page.locator('[role="dialog"]').first().getByRole('button', { name: /Закрыть|Close/i }).first().click();
  await page.locator('[role="dialog"]').waitFor({ state: 'detached' });

  // Toggle to Dark Mode
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // Open Dossier in Dark Mode
  await page.locator('button', { hasText: /Личное дело|Student Dossier/i }).first().click();
  await page.locator('[role="dialog"]').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '20_student_dossier_dark.png') });
  console.log('  -> Saved 20_student_dossier_dark.png');

  // Open Transcript in Dark Mode
  const transcriptBtnDark = page.getByRole('button', { name: /Сформировать выписку успеваемости|Generate Academic Transcript/i }).first();
  if (await transcriptBtnDark.isVisible()) {
    await transcriptBtnDark.click();
    await page.locator('text=Макет выписки').first().waitFor();
    await page.screenshot({ path: path.join(SCREENS_DIR, '21_official_transcript_dark.png') });
    console.log('  -> Saved 21_official_transcript_dark.png');
    await page.locator('[role="dialog"]').last().getByRole('button', { name: /Закрыть|Close/i }).first().click();
    await page.locator('text=Макет выписки').waitFor({ state: 'detached' });
  }

  // Close Dossier in Dark Mode
  await page.locator('[role="dialog"]').first().getByRole('button', { name: /Закрыть|Close/i }).first().click();
  await page.locator('[role="dialog"]').waitFor({ state: 'detached' });

  // 6. Exam Editor Modal
  console.log('[6/6] Testing Schedule & Exam Editor Modal in Dark & Light Mode...');
  await page.locator('aside button', { hasText: /Диспетчер расписания|Faculty Timetable/i }).click();
  await page.waitForTimeout(500);
  await page.locator('main').getByRole('button', { name: /Экзаменационная сессия|Экзамены|Exams/i }).first().click();
  await page.waitForTimeout(500);

  // Open Exam Editor in Dark Mode
  const createExamBtn = page.getByRole('button', { name: /Назначить экзамен|Schedule Exam/i }).first();
  await createExamBtn.click();
  await page.locator('[role="dialog"]').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '22_exam_editor_dark.png') });
  console.log('  -> Saved 22_exam_editor_dark.png');
  await page.locator('[role="dialog"]').getByRole('button', { name: /Отмена|Закрыть|Cancel|Close/i }).first().click();
  await page.locator('[role="dialog"]').waitFor({ state: 'detached' });

  // Switch to Light Mode
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'));

  // Open Exam Editor in Light Mode
  await createExamBtn.click();
  await page.locator('[role="dialog"]').first().waitFor();
  await page.screenshot({ path: path.join(SCREENS_DIR, '22_exam_editor_light.png') });
  console.log('  -> Saved 22_exam_editor_light.png');
  await page.locator('[role="dialog"]').getByRole('button', { name: /Отмена|Закрыть|Cancel|Close/i }).first().click();
  await page.locator('[role="dialog"]').waitFor({ state: 'detached' });

  // Back to Dark Mode
  await page.getByRole('button', { name: /Toggle theme/i }).first().click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'));

  // 7. Logout
  console.log('Logging out staff...');
  await page.getByRole('button', { name: /Logout/i }).first().click();
  await page.waitForSelector('input[type="email"]');
  console.log('Staff logged out successfully.');

  await browser.close();

  if (errors.length > 0) {
    console.error('Warnings/Errors found during Agent Staff execution:', errors);
  } else {
    console.log('=== [Agent Staff] All dark mode tests and staff modals PASSED with zero errors! ===');
  }
}

run().catch((err) => {
  console.error('Agent Staff FATAL:', err);
  process.exit(1);
});
