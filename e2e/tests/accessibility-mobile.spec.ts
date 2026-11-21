import { test, expect, Page, Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'DemoStudent123!';
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD || 'DemoStaff123!';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByPlaceholder('student@demo.edu').fill(email);
  await page.getByPlaceholder('••••••••••••').fill(password);
  await page.getByRole('button', { name: /Войти в личный кабинет|Authenticate & Sign In/i }).click();
}

async function setThemeMode(page: Page, target: 'light' | 'dark') {
  const isDark = await page.locator('html').evaluate((el) => el.classList.contains('dark'));
  if ((target === 'dark' && !isDark) || (target === 'light' && isDark)) {
    await page.getByRole('button', { name: /Toggle theme/i }).click();
  }
  if (target === 'dark') {
    await expect(page.locator('html')).toHaveClass(/dark/);
  } else {
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  }
}

async function setLangMode(page: Page, target: 'ru' | 'en') {
  const current = await page.locator('html').getAttribute('lang');
  if (current !== target) {
    await page.getByTitle(/Switch to English|Переключить на русский/i).click();
  }
  await expect(page.locator('html')).toHaveAttribute('lang', target);
}

async function assertAxeWcagAA(page: Page, contextLabel: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const relevant = results.violations.filter(
    (v) =>
      v.impact === 'critical' ||
      v.impact === 'serious' ||
      (v.impact === 'moderate' && !['heading-order', 'landmark-one-main', 'region'].includes(v.id)),
  );
  expect(
    relevant,
    `Axe WCAG AA (including color-contrast) violations on ${contextLabel}: ${JSON.stringify(
      relevant.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.html) })),
    )}`,
  ).toEqual([]);
  expect(
    results.violations.some((v) => v.id === 'color-contrast'),
    `WCAG AA color-contrast violation on ${contextLabel}`,
  ).toBe(false);
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(
    overflow.scrollWidth,
    `${label}: horizontal overflow scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`,
  ).toBeLessThanOrEqual(overflow.innerWidth + 1);
}

async function assertTouchTarget(locator: Locator, label: string) {
  await expect(locator, `${label} must be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} must have a boundingBox`).not.toBeNull();
  expect(box!.height, `${label} height (${box!.height}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
  expect(box!.width, `${label} width (${box!.width}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
}

async function assertFooterVisible(page: Page, lang: 'ru' | 'en', label: string) {
  const expected = lang === 'ru' ? /Конкурсный концепт/i : /Competition concept/i;
  await expect(page.locator('footer').getByText(expected), `${label} (${lang}) missing disclaimer footer`).toBeVisible();
}

async function assertZeroLocalStorageJwt(page: Page, label: string) {
  const dump = await page.evaluate(() =>
    JSON.stringify({ local: window.localStorage, session: window.sessionStorage }),
  );
  expect(dump, `${label}: JWT found in browser storage`).not.toMatch(/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}/);
  const lower = dump.toLowerCase();
  expect(lower, `${label}: access_token found in browser storage`).not.toContain('access_token');
  expect(lower, `${label}: jwt key found in browser storage`).not.toContain('jwt');
  expect(lower, `${label}: dean_current_user found in browser storage`).not.toContain('dean_current_user');
}

function getModalLocator(page: Page) {
  return page.locator('div.fixed.inset-0.z-50 > div, [role="dialog"]:not(.fixed.inset-0)').first();
}

async function waitForMainContentLoaded(page: Page) {
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main > div.animate-pulse')).toHaveCount(0);
  await expect(page.locator('main h1')).toBeVisible();
}

async function navigateStudentTab(
  page: Page,
  isMobile: boolean,
  tab: 'today' | 'schedule' | 'grades' | 'requests' | 'notifications' | 'profile',
) {
  if (tab === 'notifications') {
    await page.getByRole('button', { name: /Уведомления и приказы|Notifications/i }).click();
    await waitForMainContentLoaded(page);
    return;
  }
  const desktopLabels: Record<Exclude<typeof tab, 'notifications'>, RegExp> = {
    today: /Главная \(Сегодня\)|Academic Overview/i,
    schedule: /Расписание и сессия|Timetable & Exams/i,
    grades: /Зачетная книжка|Academic Records/i,
    requests: /Справки и документы|Official Certificates/i,
    profile: /Учебная карточка|Student Dossier/i,
  };
  const mobileLabels: Record<Exclude<typeof tab, 'notifications'>, RegExp> = {
    today: /Главная|Overview/i,
    schedule: /Расписание|Timetable/i,
    grades: /Зачетка|Records/i,
    requests: /Справки|Requests/i,
    profile: /Профиль|Dossier/i,
  };
  if (isMobile) {
    await page.locator('nav.fixed').getByRole('button', { name: mobileLabels[tab] }).click();
  } else {
    await page.locator('aside').getByRole('button', { name: desktopLabels[tab] }).click();
  }
  await waitForMainContentLoaded(page);
}

async function navigateStaffTab(
  page: Page,
  isMobile: boolean,
  tab: 'staff_requests' | 'staff_students' | 'schedule' | 'staff_actions' | 'profile',
) {
  const desktopLabels: Record<typeof tab, RegExp> = {
    staff_requests: /Заявления студентов|Student Inquiries/i,
    staff_students: /Группы и студенты|Groups & Students/i,
    schedule: /Диспетчер расписания|Faculty Timetable/i,
    staff_actions: /Публикация приказов|Decrees & Notices/i,
    profile: /Служебный профиль|Staff Dossier/i,
  };
  const mobileLabels: Record<typeof tab, RegExp> = {
    staff_requests: /Заявления|Inbox/i,
    staff_students: /Группы|Groups/i,
    schedule: /Диспетчер|Timetable/i,
    staff_actions: /Приказы|Decrees/i,
    profile: /Служебный|Staff/i,
  };
  if (isMobile) {
    await page.locator('nav.fixed').getByRole('button', { name: mobileLabels[tab] }).click();
  } else {
    await page.locator('aside').getByRole('button', { name: desktopLabels[tab] }).click();
  }
  await waitForMainContentLoaded(page);
}

test.describe('Tier 2/3 WCAG AA (Light/Dark), 360px Overflow, 44px Touch Targets, Footer & Storage Audit', () => {
  test('1. LoginPage (RU & EN, Light & Dark): Axe WCAG AA with color-contrast, 360px overflow, 44px touch targets & footer', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-chromium';
    await page.goto('/');

    // RU Light
    await setLangMode(page, 'ru');
    await setThemeMode(page, 'light');
    await assertFooterVisible(page, 'ru', 'LoginPage');
    await assertNoHorizontalOverflow(page, 'LoginPage RU Light');
    await assertAxeWcagAA(page, 'LoginPage RU Light');

    if (isMobile) {
      await assertTouchTarget(page.getByRole('button', { name: /Toggle password visibility/i }), 'Login password toggle');
      await assertTouchTarget(page.getByRole('button', { name: /Войти в личный кабинет/i }), 'Login submit button');
      await assertTouchTarget(page.getByRole('button', { name: /Toggle language/i }), 'Login language toggle');
      await assertTouchTarget(page.getByRole('button', { name: /Toggle theme/i }), 'Login theme toggle');
    }

    // EN Dark
    await setLangMode(page, 'en');
    await setThemeMode(page, 'dark');
    await assertFooterVisible(page, 'en', 'LoginPage');
    await assertNoHorizontalOverflow(page, 'LoginPage EN Dark');
    await assertAxeWcagAA(page, 'LoginPage EN Dark');
  });

  test('2. Student Aigul views & modals (Light & Dark, RU & EN): Axe WCAG AA, 360px overflow, 44px targets, footer & zero JWT', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const isMobile = testInfo.project.name === 'mobile-chromium';

    await loginAs(page, 'aigul.nurova@demo.edu', STUDENT_PASSWORD);
    await expect(page.locator('main').getByText(/Айгуль/i).first()).toBeVisible();
    await assertZeroLocalStorageJwt(page, 'Student Aigul');

    if (isMobile) {
      // BottomNav 44px touch targets
      const navButtons = page.locator('nav.fixed button');
      const navCount = await navButtons.count();
      expect(navCount).toBeGreaterThanOrEqual(5);
      for (let i = 0; i < navCount; i++) {
        await assertTouchTarget(navButtons.nth(i), `Student BottomNav button #${i}`);
      }

      // Header interactive buttons 44px touch targets
      const headerButtons = page.locator('header button:visible');
      const headerCount = await headerButtons.count();
      expect(headerCount).toBeGreaterThanOrEqual(4);
      for (let i = 0; i < headerCount; i++) {
        await assertTouchTarget(headerButtons.nth(i), `Student Header button #${i}`);
      }
    }

    const tabs: Array<'today' | 'schedule' | 'grades' | 'requests' | 'notifications' | 'profile'> = [
      'today',
      'schedule',
      'grades',
      'requests',
      'notifications',
      'profile',
    ];

    for (const theme of ['light', 'dark'] as const) {
      await setThemeMode(page, theme);
      const lang: 'ru' | 'en' = theme === 'light' ? 'ru' : 'en';
      await setLangMode(page, lang);

      for (const tab of tabs) {
        await navigateStudentTab(page, isMobile, tab);
        await assertFooterVisible(page, lang, `Student ${tab}`);
        await assertNoHorizontalOverflow(page, `Student ${tab} (${theme}, ${lang})`);
        await assertAxeWcagAA(page, `Student ${tab} (${theme}, ${lang})`);

        if (tab === 'schedule') {
          await page.locator('main').getByRole('button', { name: /Экзамены и сессия|Exams & Session/i }).first().click();
          await assertNoHorizontalOverflow(page, `Student schedule exams (${theme}, ${lang})`);
          await assertAxeWcagAA(page, `Student schedule exams (${theme}, ${lang})`);
          await page.locator('main').getByRole('button', { name: /^(Занятия|Classes)$/i }).first().click();
        }

        if (tab === 'requests') {
          const orderBtn = page.getByRole('button', { name: /Подать новое заявление|Order Document/i });
          if (isMobile && theme === 'light') {
            await assertTouchTarget(orderBtn, 'Requests Order Document button');
          }
          await orderBtn.click();
          const wizard = getModalLocator(page);
          await expect(wizard).toBeVisible();
          await assertNoHorizontalOverflow(page, `Requests Order Wizard (${theme}, ${lang})`);
          await assertAxeWcagAA(page, `Requests Order Wizard (${theme}, ${lang})`);
          const closeWizard = wizard.getByRole('button', { name: /Закрыть|Close/i }).first();
          if (isMobile && theme === 'light') {
            await assertTouchTarget(closeWizard, 'Requests Wizard close button');
          }
          await closeWizard.click();
        }
      }
    }

    // Modals: StudentCardModal (normal + expanded QR) & AssistantModal in Light and Dark
    for (const theme of ['light', 'dark'] as const) {
      await setThemeMode(page, theme);

      await page.getByRole('button', { name: /Электронный студенческий билет|Digital Student ID/i }).click();
      const cardModal = getModalLocator(page);
      await expect(cardModal).toBeVisible();
      await assertNoHorizontalOverflow(page, `StudentCardModal (${theme})`);
      await assertAxeWcagAA(page, `StudentCardModal (${theme})`);
      if (isMobile && theme === 'light') {
        await assertTouchTarget(cardModal.getByRole('button', { name: /Закрыть|Close/i }).first(), 'StudentCard close button');
        await assertTouchTarget(
          cardModal.getByRole('button', { name: /Приложить к турникету|Tap at Turnstile/i }),
          'StudentCard NFC button',
        );
      }

      // Expanded QR Scanner view inside StudentCardModal
      await cardModal.getByTitle(/открыть QR-код на весь экран|enlarge QR for scanner/i).click();
      const qrScanBtn = cardModal.getByRole('button', { name: /Проверить считывание сканером|Test Optical Scanner Read/i });
      await expect(qrScanBtn).toBeVisible();
      await assertNoHorizontalOverflow(page, `StudentCardModal QR Expanded (${theme})`);
      await assertAxeWcagAA(page, `StudentCardModal QR Expanded (${theme})`);
      const qrCloseBtn = cardModal.getByRole('button', { name: /Закрыть сканер|Close scanner view/i });
      if (isMobile && theme === 'light') {
        await assertTouchTarget(qrCloseBtn, 'StudentCard QR expanded close button');
        await assertTouchTarget(qrScanBtn, 'StudentCard QR expanded scan button');
      }
      await qrCloseBtn.click();
      await cardModal.getByRole('button', { name: /Закрыть|Close/i }).first().click();

      await page.getByRole('button', { name: /Консультант|Copilot|Academic Advisory/i }).first().click();
      const aiModal = getModalLocator(page);
      await expect(aiModal).toBeVisible();
      await assertNoHorizontalOverflow(page, `AssistantModal (${theme})`);
      await assertAxeWcagAA(page, `AssistantModal (${theme})`);
      if (isMobile && theme === 'light') {
        await assertTouchTarget(aiModal.getByRole('button', { name: /Закрыть|Close/i }).first(), 'Assistant close button');
        await assertTouchTarget(aiModal.locator('form button[type="submit"]'), 'Assistant send button');
      }
      await aiModal.getByRole('button', { name: /Закрыть|Close/i }).first().click();
    }

    // Also verify (dark, ru) pairing on Student views
    await setThemeMode(page, 'dark');
    await setLangMode(page, 'ru');
    for (const tab of ['today', 'requests'] as const) {
      await navigateStudentTab(page, isMobile, tab);
      await assertFooterVisible(page, 'ru', `Student ${tab} (dark, ru)`);
      await assertNoHorizontalOverflow(page, `Student ${tab} (dark, ru)`);
      await assertAxeWcagAA(page, `Student ${tab} (dark, ru)`);
    }

    await assertZeroLocalStorageJwt(page, 'Student Aigul end');
  });

  test('3. Student Timur (Grades debt banner & CertificatePreviewModal, Light & Dark): Axe WCAG AA & 360px overflow', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-chromium';

    await loginAs(page, 'timur.belov@demo.edu', STUDENT_PASSWORD);
    await expect(page.locator('main').getByText(/Тимур/i).first()).toBeVisible();

    for (const theme of ['light', 'dark'] as const) {
      await setThemeMode(page, theme);

      await navigateStudentTab(page, isMobile, 'grades');
      await expect(page.getByText(/Академическая задолженность: Статистика/i)).toBeVisible();
      await assertNoHorizontalOverflow(page, `Timur Grades debt banner (${theme})`);
      await assertAxeWcagAA(page, `Timur Grades debt banner (${theme})`);

      await navigateStudentTab(page, isMobile, 'requests');
      await page.getByRole('button', { name: /Макет PDF|Preview PDF/i }).first().click();
      const certModal = getModalLocator(page);
      await expect(certModal.getByText(/ИЛЛЮСТРАТИВНЫЙ ШТАМП|ILLUSTRATIVE SEAL/i)).toBeVisible();
      await assertNoHorizontalOverflow(page, `CertificatePreviewModal (${theme})`);
      await assertAxeWcagAA(page, `CertificatePreviewModal (${theme})`);
      if (isMobile && theme === 'light') {
        await assertTouchTarget(certModal.getByRole('button', { name: /Закрыть|Close/i }).first(), 'CertificatePreview close');
      }
      await certModal.getByRole('button', { name: /Закрыть|Close/i }).first().click();
    }
  });

  test('4. Staff views & modals (Light & Dark, RU & EN): Axe WCAG AA, 360px overflow, 44px targets, footer & zero JWT', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const isMobile = testInfo.project.name === 'mobile-chromium';

    await loginAs(page, 'dean.office@demo.edu', STAFF_PASSWORD);
    await expect(page.getByText(/Заявления и документы студентов|Student Requests & Documents/i)).toBeVisible();
    await assertZeroLocalStorageJwt(page, 'Staff');

    if (isMobile) {
      const navButtons = page.locator('nav.fixed button');
      const navCount = await navButtons.count();
      expect(navCount).toBeGreaterThanOrEqual(5);
      for (let i = 0; i < navCount; i++) {
        await assertTouchTarget(navButtons.nth(i), `Staff BottomNav button #${i}`);
      }

      const headerButtons = page.locator('header button:visible');
      const headerCount = await headerButtons.count();
      expect(headerCount).toBeGreaterThanOrEqual(4);
      for (let i = 0; i < headerCount; i++) {
        await assertTouchTarget(headerButtons.nth(i), `Staff Header button #${i}`);
      }
    }

    const staffTabs: Array<'staff_requests' | 'staff_actions' | 'staff_students' | 'schedule' | 'profile'> = [
      'staff_requests',
      'staff_actions',
      'staff_students',
      'schedule',
      'profile',
    ];

    for (const theme of ['light', 'dark'] as const) {
      await setThemeMode(page, theme);
      const lang: 'ru' | 'en' = theme === 'light' ? 'ru' : 'en';
      await setLangMode(page, lang);

      for (const tab of staffTabs) {
        await navigateStaffTab(page, isMobile, tab);
        await assertFooterVisible(page, lang, `Staff ${tab}`);
        await assertNoHorizontalOverflow(page, `Staff ${tab} (${theme}, ${lang})`);
        await assertAxeWcagAA(page, `Staff ${tab} (${theme}, ${lang})`);

        if (tab === 'staff_students') {
          await page.locator('main').getByRole('button', { name: /Личное дело|Student Dossier/i }).first().click();
          const dossierModal = getModalLocator(page);
          await expect(dossierModal).toBeVisible();
          await assertNoHorizontalOverflow(page, `StudentDossierModal (${theme}, ${lang})`);
          await assertAxeWcagAA(page, `StudentDossierModal (${theme}, ${lang})`);

          await dossierModal.getByRole('button', { name: /Сформировать выписку|Generate Academic Transcript/i }).click();
          const transcriptModal = page.locator('div.fixed.inset-0.z-50 > div, [role="dialog"]:not(.fixed.inset-0)').last();
          await expect(transcriptModal.getByText(/Печать \/ PDF|Print \/ PDF/i)).toBeVisible();
          await assertNoHorizontalOverflow(page, `OfficialTranscriptModal (${theme}, ${lang})`);
          await assertAxeWcagAA(page, `OfficialTranscriptModal (${theme}, ${lang})`);

          await transcriptModal.getByRole('button', { name: /Закрыть|Close/i }).first().click();
          await dossierModal.getByRole('button', { name: /Закрыть|Close/i }).last().click();
          await expect(dossierModal).toBeHidden();
        }
      }
    }

    // Also verify (dark, ru) pairing on Staff views
    await setThemeMode(page, 'dark');
    await setLangMode(page, 'ru');
    for (const tab of ['staff_requests', 'staff_students'] as const) {
      await navigateStaffTab(page, isMobile, tab);
      await assertFooterVisible(page, 'ru', `Staff ${tab} (dark, ru)`);
      await assertNoHorizontalOverflow(page, `Staff ${tab} (dark, ru)`);
      await assertAxeWcagAA(page, `Staff ${tab} (dark, ru)`);
    }

    await assertZeroLocalStorageJwt(page, 'Staff end');
  });
});
