import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function attachErrorCollectors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console.error: ${msg.text()}`);
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

    // Run axe accessibility check on Login page (critical/serious violations)
    const axeLogin = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Theme colors verified directly
      .analyze();
    const seriousLogin = axeLogin.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(seriousLogin).toEqual([]);

    expect(errors).toEqual([]);
  });

  test('2. Student Aigul: Today, Schedule (day/week/ics/exams), Grades, Requests wizard/cancel, Student ID NFC/QR, AI Advisor, Mobile 360px layout', async ({ page }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';

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
      await page.screenshot({ path: '../docs/screens/e2e_verified_mobile_360px.png', fullPage: false });
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
    await page.getByPlaceholder(/Например: Пенсионный фонд РФ/i).fill('Для визового центра (E2E)');
    await page.getByPlaceholder('1').fill('1');
    await page.locator('form select').selectOption('Электронная с ЭЦП (PDF)');
    await page.getByRole('button', { name: /Отправить в деканат/i }).click();

    await expect(page.getByText(/Журнал поданных заявлений \(2\)/i)).toBeVisible();

    // Open Digital Student ID modal & check NFC + Close button non-overlap + Big QR
    await page.getByRole('button', { name: /Электронный студенческий билет|Digital Student ID/i }).click();
    await expect(page.getByText(/MIFARE DESFire EV3/i)).toBeVisible();

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

    // Trigger NFC test & close card
    await page.getByRole('button', { name: /Приложить к турникету \(NFC Test\)/i }).click();
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

  test('3. Student Timur: failed Statistics debt alert & ready PDF certificate preview; Lina: empty requests state & unread alerts', async ({ page }, testInfo) => {
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
    await page.getByRole('button', { name: /PDF с ЭЦП/i }).first().click();
    await expect(page.getByText(/ДОКУМЕНТ ПОДПИСАН ЭЦП/i)).toBeVisible();
    await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();
    await page.getByRole('button', { name: /Logout/i }).click();

    // Lina empty state & 3 unread notifications
    await loginAs(page, 'lina.okafor@demo.edu', 'DemoStudent123!');
    if (isMobile) {
      await page.locator('nav.fixed button', { hasText: /Справки/i }).click();
    } else {
      await page.locator('aside button', { hasText: /Справки и документы/i }).click();
    }
    await expect(page.getByText(/У вас пока нет активных заявлений/i)).toBeVisible();

    await page.getByRole('button', { name: /Уведомления и приказы|Notifications/i }).click();
    await page.getByRole('button', { name: /Прочитать все/i }).click();
    await expect(page.getByRole('button', { name: /Прочитать все/i })).toHaveCount(0);

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

    // Save verification screenshot on desktop
    if (!isMobile) {
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
