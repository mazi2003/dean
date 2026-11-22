import { test, expect, Page, BrowserContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

async function attachErrorCollectors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Expected 401 on initial unauthenticated /profile probe and negative login test
      if (text.includes('401 (Unauthorized)')) return;
      errors.push(`console.error: ${text}`);
    }
  });
  return errors;
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByPlaceholder('student@demo.edu').fill(email);
  await page.getByPlaceholder('••••••••••••').fill(password);
  await page.getByRole('button', { name: /Войти в личный кабинет|Authenticate & Sign In/i }).click();
}

test.describe('Digital Dean Office E2E Journeys (Desktop & Mobile)', () => {
  test('1. Login error handling, password toggle, NO Demo Switcher, disclaimer & WCAG checks', async ({ page }) => {
    const errors = await attachErrorCollectors(page);
    await page.goto('/');

    // Verify NO Demo quick-switch buttons exist on Login or Header
    await expect(page.getByText(/^Demo:$/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Айгуль$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Деканат$/ })).toHaveCount(0);

    // Mandatory disclaimer on login footer
    await expect(page.getByText(/Конкурсный концепт/i)).toBeVisible();

    // Password visibility toggle
    const pwd = page.getByPlaceholder('••••••••••••');
    await expect(pwd).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: /Toggle password visibility/i }).click();
    await expect(pwd).toHaveAttribute('type', 'text');

    // Invalid password displays error
    await page.getByPlaceholder('student@demo.edu').fill('aigul.nurova@demo.edu');
    await pwd.fill('WrongPassword!');
    await page.getByRole('button', { name: /Войти в личный кабинет/i }).click();
    await expect(page.getByText(/Неверный адрес электронной почты или пароль/i)).toBeVisible();

    // Run axe accessibility check on Login page (critical/serious violations, color-contrast enabled)
    const axeLogin = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const seriousLogin = axeLogin.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(seriousLogin).toEqual([]);

    expect(errors).toEqual([]);
  });

  test('2. Student Aigul: Today, Schedule (day/week/ics/exams), Grades, Requests wizard/cancel, Student ID NFC/QR, AI Advisor, Mobile 360px layout', async ({ page }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';
    const uniquePurpose = `Для визового центра (E2E-${testInfo.project.name})`;

    await loginAs(page, 'aigul.nurova@demo.edu', 'DemoStudent123!');
    await expect(page.locator('main').getByText(/Айгуль/i).first()).toBeVisible();

    // Mandatory disclaimer footer visible inside app
    await expect(page.getByText(/Конкурсный концепт/i).first()).toBeVisible();

    // Check responsive viewport invariants on mobile 360px
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);

    if (isMobile) {
      // Verify bottom nav touch targets meet >= 44px WCAG target size
      const navButtons = page.locator('nav.fixed button');
      const count = await navButtons.count();
      expect(count).toBeGreaterThanOrEqual(4);
      for (let i = 0; i < count; i++) {
        const box = await navButtons.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
      }
      if (process.env.SAVE_SCREENS === '1') {
        await page.screenshot({ path: '../docs/screens/e2e_verified_mobile_360px.png', fullPage: false });
      }
    }

    // Navigate to Schedule
    if (isMobile) {
      await page.locator('nav.fixed button', { hasText: /Расписание|Timetable/i }).click();
    } else {
      await page.locator('aside button', { hasText: /Расписание и сессия/i }).click();
    }
    await expect(page.getByText(/Дипломатический протокол/i).first()).toBeVisible();

    // Switch to Week view & verify room/status change badges
    await page.getByRole('button', { name: /Вся неделя/i }).click();
    await expect(page.getByText(/Замена аудитории|Отменено|Перенос/i).first()).toBeVisible();

    // Export .ics calendar & verify RFC 5545 envelope and exclusion of cancelled classes
    const scheduleRes = await page.request.get('/api/v1/schedule');
    expect(scheduleRes.status()).toBe(200);
    const scheduleEntries = (await scheduleRes.json()) as Array<{ id: string; status: string }>;
    const cancelledIds = scheduleEntries.filter((e) => e.status === 'cancelled').map((e) => e.id);

    const [icsDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Экспорт \.ICS|Export \.ICS|календарь \(\.ics\)|calendar \(\.ics\)/i }).click(),
    ]);
    expect(icsDownload.suggestedFilename()).toMatch(/^demotech-schedule-.*\.ics$/);
    const icsPath = await icsDownload.path();
    expect(icsPath).toBeTruthy();
    const icsContent = fs.readFileSync(icsPath!, 'utf8');
    expect(icsContent).toContain('BEGIN:VCALENDAR');
    expect(icsContent).toContain('END:VCALENDAR');
    expect(icsContent).not.toContain('STATUS:CANCELLED');
    for (const cancelledId of cancelledIds) {
      expect(icsContent).not.toContain(`UID:${cancelledId}@demotech.edu`);
    }

    // Switch to Exams sub-tab
    await page.locator('main').getByRole('button', { name: /Экзаменационная сессия|Экзамены/i }).first().click();
    await expect(page.getByText(/LAW-201/i).first()).toBeVisible();

    // Navigate to Grades
    if (isMobile) {
      await page.locator('nav.fixed button', { hasText: /Зачетка/i }).click();
    } else {
      await page.locator('aside button', { hasText: /Зачетная книжка/i }).click();
    }
    await expect(page.locator('main').getByText('4.80').first()).toBeVisible();

    // Navigate to Requests -> open wizard -> submit request -> expand -> cancel
    if (isMobile) {
      await page.locator('nav.fixed button', { hasText: /Справки/i }).click();
    } else {
      await page.locator('aside button', { hasText: /Справки и документы/i }).click();
    }
    await expect(page.getByText(/Журнал поданных заявлений/i)).toBeVisible();

    await page.getByRole('button', { name: /Подать новое заявление/i }).click();
    await page.getByPlaceholder(/Например: Пенсионный фонд РФ/i).fill(uniquePurpose);
    await page.getByPlaceholder('1').fill('1');
    await page.locator('form select').selectOption('Электронный макет (PDF, демо)');

    let createdRequestId: string | null = null;
    let cancelledInUi = false;
    const [createRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/requests') && res.request().method() === 'POST'),
      page.getByRole('button', { name: /Отправить в деканат/i }).click(),
    ]);
    expect(createRes.status()).toBe(201);
    const createdRequest = (await createRes.json()) as { id: string };
    createdRequestId = createdRequest.id;

    try {
      await expect(page.getByText(/Для визового центра \(E2E-|Справка об обучении/i).first()).toBeVisible();
      await expect(page.getByText(/Журнал поданных заявлений \([2-9]\d*\)/i)).toBeVisible();

      // Expand and cancel the newly created request so Aigul's seeded in_review request stays clean
      const createdCard = page.locator('div.divide-y > div').filter({ hasText: createdRequest.id });
      await expect(createdCard).toBeVisible();
      await createdCard.getByRole('button', { name: /Подробнее|Details/i }).click();
      await expect(createdCard.getByText(uniquePurpose)).toBeVisible();

      page.once('dialog', (dialog) => dialog.accept());
      const [cancelRes] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes(`/api/v1/requests/${createdRequest.id}/cancel`) && res.request().method() === 'POST'
        ),
        createdCard.getByRole('button', { name: /Отозвать заявление|Withdraw Request/i }).click(),
      ]);
      expect(cancelRes.status()).toBe(200);
      cancelledInUi = true;
      await expect(createdCard.getByText(/Отозвано|Отменено|Cancelled/i).first()).toBeVisible();
    } finally {
      if (createdRequestId && !cancelledInUi) {
        const origin = new URL(page.url()).origin;
        await page.request.post(`${origin}/api/v1/requests/${createdRequestId}/cancel`).catch(() => {});
      }
    }

    // Open Digital Student ID modal & check NFC + Close button non-overlap + Big QR
    await page.getByRole('button', { name: /Электронный студенческий билет|Digital Student ID/i }).click();
    await expect(page.getByText(/симуляция NFC \/ QR-пропуска/i)).toBeVisible();

    const imgCheck = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).map((img) => ({
        src: img.src.slice(0, 60),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
      }))
    );
    expect(imgCheck.length).toBeGreaterThan(0);
    for (const img of imgCheck) {
      expect(img.src).not.toContain('unsplash.com');
      expect(img.complete).toBe(true);
      expect(img.naturalWidth).toBeGreaterThan(0);
    }

    const closeBtnBox = await page.getByRole('button', { name: /Закрыть|Close/i }).first().boundingBox();
    const nfcBadge = page.getByText('NFC', { exact: true }).first();
    const nfcBadgeBox = await nfcBadge.boundingBox();
    if (closeBtnBox && nfcBadgeBox) {
      // Ensure zero spatial overlap between Close (X) and NFC badge
      const overlapsHorizontally = closeBtnBox.x < nfcBadgeBox.x + nfcBadgeBox.width && closeBtnBox.x + closeBtnBox.width > nfcBadgeBox.x;
      const overlapsVertically = closeBtnBox.y < nfcBadgeBox.y + nfcBadgeBox.height && closeBtnBox.y + closeBtnBox.height > nfcBadgeBox.y;
      expect(overlapsHorizontally && overlapsVertically).toBe(false);
    }

    // Trigger NFC simulation & close card
    await page.getByRole('button', { name: /Приложить к турникету \(Симуляция NFC\)/i }).click();
    await expect(page.getByText(/Проход через турникет разрешен/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

    // Open AI Assistant & ask question
    await page.getByRole('button', { name: /Консультант|Copilot/i }).first().click();
    await page.getByRole('button', { name: /Часы приема и контакты деканата\?/i }).click();
    await expect(page.getByText(/кабинет 312/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

    // Dark theme toggle & Logout
    await page.getByRole('button', { name: /Toggle Theme/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page.getByPlaceholder('student@demo.edu')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('3. Student Timur: failed Statistics debt alert & ready PDF certificate preview; Lina: empty requests state & unread alerts', async ({ page, browser }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';

    // Timur
    await loginAs(page, 'timur.belov@demo.edu', 'DemoStudent123!');
    if (isMobile) {
      await page.locator('nav.fixed button', { hasText: /Зачетка/i }).click();
    } else {
      await page.locator('aside button', { hasText: /Зачетная книжка/i }).click();
    }
    await expect(page.getByText(/Академическая задолженность: Статистика/i)).toBeVisible();

    if (isMobile) {
      await page.locator('nav.fixed button', { hasText: /Справки/i }).click();
    } else {
      await page.locator('aside button', { hasText: /Справки и документы/i }).click();
    }
    await page.getByRole('button', { name: /Макет PDF/i }).first().click();
    await expect(page.getByText(/ИЛЛЮСТРАТИВНЫЙ ШТАМП \(ДЕМО\)/i)).toBeVisible();
    await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();
    await page.getByRole('button', { name: /Logout/i }).click();

    // Lina empty state & deterministic unread notifications
    await loginAs(page, 'lina.okafor@demo.edu', 'DemoStudent123!');
    if (isMobile) {
      await page.locator('nav.fixed button', { hasText: /Справки/i }).click();
    } else {
      await page.locator('aside button', { hasText: /Справки и документы/i }).click();
    }
    await expect(page.getByText(/У вас пока нет активных заявлений/i)).toBeVisible();

    let staffCtx: BrowserContext | null = null;
    let tempAnnouncementId: string | null = null;
    const origin = new URL(page.url()).origin;

    try {
      const notifStateRes = await page.request.get('/api/v1/notifications');
      expect(notifStateRes.status()).toBe(200);
      const notifState = (await notifStateRes.json()) as { unreadCount: number };

      if (notifState.unreadCount === 0) {
        staffCtx = await browser.newContext();
        const staffLoginRes = await staffCtx.request.post(`${origin}/api/v1/auth/login`, {
          data: { email: 'dean.office@demo.edu', password: 'DemoStaff123!' },
        });
        expect(staffLoginRes.status()).toBe(200);

        const studentsRes = await staffCtx.request.get(`${origin}/api/v1/staff/students`);
        expect(studentsRes.status()).toBe(200);
        const students = (await studentsRes.json()) as Array<{ id: string; email: string }>;
        const lina = students.find((s) => s.email === 'lina.okafor@demo.edu');
        expect(lina).toBeDefined();

        const annRes = await staffCtx.request.post(`${origin}/api/v1/staff/announcements`, {
          data: {
            title: `E2E Unread Determinism (${testInfo.project.name})`,
            body: 'Temporary targeted notification for unread mark-all verification.',
            targetUserId: lina!.id,
            priority: 'high',
            kind: 'announcement',
          },
        });
        expect(annRes.status()).toBe(201);
        const annJson = (await annRes.json()) as { id: string };
        tempAnnouncementId = annJson.id;

        await page.reload();
      }

      const bellBtn = page.getByRole('button', { name: /Уведомления и приказы|Notifications/i });
      await expect(bellBtn).toContainText(/[1-9]/);
      await bellBtn.click();

      const markAllBtn = page.getByRole('button', { name: /Прочитать все/i });
      await expect(markAllBtn).toBeVisible();
      await markAllBtn.click();
      await expect(markAllBtn).toHaveCount(0);
    } finally {
      if (staffCtx && tempAnnouncementId) {
        await staffCtx.request.delete(`${origin}/api/v1/staff/announcements/${tempAnnouncementId}`).catch(() => {});
      }
      if (staffCtx) {
        await staffCtx.close();
      }
    }

    expect(errors).toEqual([]);
  });

  test('4. Staff workflow: Dean Office inbox, status review, groups roster, student dossier, and exam dispatcher', async ({ page }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';

    await loginAs(page, 'dean.office@demo.edu', 'DemoStaff123!');
    await expect(page.getByText(/Заявления и документы студентов/i)).toBeVisible();

    // Navigate to Groups & Students
    if (isMobile) {
      await page.locator('nav.fixed button', { hasText: /Группы/i }).click();
    } else {
      await page.locator('aside button', { hasText: /Группы и студенты/i }).click();
    }
    await expect(page.getByText(/Академические группы/i).first()).toBeVisible();
    await expect(page.getByText(/Тимур Белов/i).first()).toBeVisible();

    // Optional verification screenshot on desktop when SAVE_SCREENS=1
    if (!isMobile && process.env.SAVE_SCREENS === '1') {
      await page.screenshot({ path: '../docs/screens/e2e_verified_staff_groups.png', fullPage: false });
    }

    // Open Schedule / Exams Dispatcher
    if (isMobile) {
      await page.locator('nav.fixed button', { hasText: /Диспетчер/i }).click();
    } else {
      await page.locator('aside button', { hasText: /Диспетчер расписания/i }).click();
    }
    await page.locator('main').getByRole('button', { name: /Экзаменационная сессия|Экзамены/i }).first().click();
    await expect(page.getByRole('button', { name: /Назначить экзамен/i })).toBeVisible();

    expect(errors).toEqual([]);
  });
});
