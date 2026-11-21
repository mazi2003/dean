import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';

const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'DemoStudent123!';
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD || 'DemoStaff123!';

async function attachErrorCollectors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
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

async function navigateStudentTab(
  page: Page,
  isMobile: boolean,
  tab: 'today' | 'schedule' | 'grades' | 'requests' | 'notifications' | 'profile',
) {
  if (tab === 'notifications') {
    await page.getByRole('button', { name: /Уведомления и приказы|Notifications/i }).click();
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
}

function getModalLocator(page: Page) {
  return page.locator('div.fixed.inset-0.z-50 > div, [role="dialog"]:not(.fixed.inset-0)').first();
}

test.describe('Tier 2/3/4 Cross-Role & Functional E2E Workflows', () => {
  test('1. Cross-role Request Lifecycle: Student submits -> Staff in_review -> ready -> Student notification & PDF preview', async ({
    page,
    browser,
  }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';
    const uniquePurpose = `E2E Cross-Role ${testInfo.project.name} ${Date.now()}`;

    // Uses d.morozov@demo.edu (ДУ-101) so Lina's seeded 0-requests empty state in portal.spec.ts stays intact across projects
    await loginAs(page, 'd.morozov@demo.edu', STUDENT_PASSWORD);
    await expect(page.locator('main').getByText(/Даниил/i).first()).toBeVisible();

    await navigateStudentTab(page, isMobile, 'requests');
    await page.getByRole('button', { name: /Подать новое заявление|Order Document/i }).click();

    const wizard = getModalLocator(page);
    await wizard.getByPlaceholder(/Например: Пенсионный фонд РФ/i).fill(uniquePurpose);
    await wizard.getByPlaceholder('1').fill('1');
    await wizard.locator('form select').selectOption('Электронный макет (PDF, демо)');

    const [createRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/requests') && r.request().method() === 'POST'),
      wizard.getByRole('button', { name: /Отправить в деканат|Submit Request/i }).click(),
    ]);
    expect(createRes.status()).toBe(201);
    const createdReq = (await createRes.json()) as { id: string };

    const studentCard = page.locator('div.divide-y > div').filter({ hasText: createdReq.id });
    await expect(studentCard).toBeVisible();
    await expect(studentCard.getByText(/Подано|Submitted/i).first()).toBeVisible();

    // Staff transitions submitted -> in_review -> ready with comments in separate context
    const staffCtx = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
    const staffPage = await staffCtx.newPage();
    try {
      await loginAs(staffPage, 'dean.office@demo.edu', STAFF_PASSWORD);
      await expect(staffPage.getByText(/Заявления и документы студентов|Student Requests & Documents/i)).toBeVisible();

      const staffCard = staffPage.locator('div.space-y-3 > div').filter({ hasText: createdReq.id });
      await expect(staffCard).toBeVisible();

      // Step 1: submitted -> in_review
      await staffCard.getByRole('button', { name: /Изменить статус|Update Status/i }).click();
      let modal = getModalLocator(staffPage);
      await modal.locator('select').selectOption('in_review');
      await modal.locator('textarea').fill('Принято в работу E2E');
      const [reviewRes] = await Promise.all([
        staffPage.waitForResponse(
          (r) => r.url().includes(`/api/v1/staff/requests/${createdReq.id}/status`) && r.request().method() === 'POST'
        ),
        modal.getByRole('button', { name: /Утвердить и уведомить|Approve & Notify/i }).click(),
      ]);
      expect(reviewRes.status()).toBe(200);
      await expect(staffCard.getByText(/В работе|В обработке|На рассмотрении|In Review/i).first()).toBeVisible();

      // Step 2: in_review -> ready
      await staffCard.getByRole('button', { name: /Изменить статус|Update Status/i }).click();
      modal = getModalLocator(staffPage);
      await modal.locator('select').selectOption('ready');
      await modal.locator('textarea').fill('Справка готова E2E');
      const [readyRes] = await Promise.all([
        staffPage.waitForResponse(
          (r) => r.url().includes(`/api/v1/staff/requests/${createdReq.id}/status`) && r.request().method() === 'POST'
        ),
        modal.getByRole('button', { name: /Утвердить и уведомить|Approve & Notify/i }).click(),
      ]);
      expect(readyRes.status()).toBe(200);
      await expect(staffCard.getByText(/Подписано ЭЦП|Готово|Ready|Signed/i).first()).toBeVisible();
    } finally {
      await staffCtx.close();
    }

    // Student receives request_update notification, sees Ready status + history comments, and opens CertificatePreviewModal
    await page.reload();
    await navigateStudentTab(page, isMobile, 'notifications');
    await expect(page.getByText(/Справка готова E2E|Готово к выдаче/i).first()).toBeVisible();

    await navigateStudentTab(page, isMobile, 'requests');
    const updatedCard = page.locator('div.divide-y > div').filter({ hasText: createdReq.id });
    await expect(updatedCard.getByText(/Подписано ЭЦП|Готово|Ready|Signed/i).first()).toBeVisible();

    await updatedCard.getByRole('button', { name: /Подробнее|Details/i }).click();
    await expect(updatedCard.getByText(/Справка готова E2E/i)).toBeVisible();

    await updatedCard.getByRole('button', { name: /Макет PDF|Preview PDF/i }).click();
    const previewModal = getModalLocator(page);
    await expect(previewModal.getByText(/ИЛЛЮСТРАТИВНЫЙ ШТАМП \(ДЕМО\)|ILLUSTRATIVE SEAL \(DEMO ONLY\)/i)).toBeVisible();
    await expect(previewModal.getByText(/Даниил Морозов/i)).toBeVisible();
    await expect(previewModal.getByText(uniquePurpose)).toBeVisible();
    await previewModal.getByRole('button', { name: /Закрыть|Close/i }).first().click();

    expect(errors).toEqual([]);
  });

  test('2. Student cancels in_review request and Staff sees cancelled status', async ({ page, browser }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';
    const uniquePurpose = `E2E Cancel InReview ${testInfo.project.name} ${Date.now()}`;

    // Uses s.kim@demo.edu (ДУ-101) so Lina's seeded 0-requests empty state stays intact
    await loginAs(page, 's.kim@demo.edu', STUDENT_PASSWORD);
    await expect(page.locator('main').getByText(/София/i).first()).toBeVisible();

    await navigateStudentTab(page, isMobile, 'requests');
    // Select transcript card (4th catalog card or button inside card containing Транскрипт)
    const transcriptCard = page.locator('div.grid > div').filter({ hasText: /Транскрипт|Transcript/i }).first();
    await transcriptCard.getByRole('button', { name: /Заказать|Request/i }).click();

    const wizard = getModalLocator(page);
    await wizard.locator('form select').first().selectOption({ index: 1 });
    await wizard.locator('form input[type="text"]').first().fill(uniquePurpose);
    await wizard.locator('form input[type="number"]').first().fill('1');

    const [createRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/requests') && r.request().method() === 'POST'),
      wizard.getByRole('button', { name: /Отправить в деканат|Submit Request/i }).click(),
    ]);
    expect(createRes.status()).toBe(201);
    const createdReq = (await createRes.json()) as { id: string };

    // Staff transitions transcript request to in_review
    const staffCtx = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
    const staffPage = await staffCtx.newPage();
    try {
      await loginAs(staffPage, 'dean.office@demo.edu', STAFF_PASSWORD);
      const staffCard = staffPage.locator('div.space-y-3 > div').filter({ hasText: createdReq.id });
      await expect(staffCard).toBeVisible();

      await staffCard.getByRole('button', { name: /Изменить статус|Update Status/i }).click();
      const modal = getModalLocator(staffPage);
      await modal.locator('select').selectOption('in_review');
      await modal.locator('textarea').fill('Взято в обработку перед отзывом E2E');
      const [reviewRes] = await Promise.all([
        staffPage.waitForResponse(
          (r) => r.url().includes(`/api/v1/staff/requests/${createdReq.id}/status`) && r.request().method() === 'POST'
        ),
        modal.getByRole('button', { name: /Утвердить и уведомить|Approve & Notify/i }).click(),
      ]);
      expect(reviewRes.status()).toBe(200);

      // Student reloads RequestsPage, expands the in_review request, sees Withdraw Request, and cancels it
      await page.reload();
      await navigateStudentTab(page, isMobile, 'requests');
      const studentCard = page.locator('div.divide-y > div').filter({ hasText: createdReq.id });
      await expect(studentCard.getByText(/На рассмотрении инспектором|В работе|В обработке|In Review/i).first()).toBeVisible();

      await studentCard.getByRole('button', { name: /Подробнее|Details/i }).click();
      const cancelBtn = studentCard.getByRole('button', { name: /Отозвать заявление|Withdraw Request/i });
      await expect(cancelBtn).toBeVisible();

      page.once('dialog', (dialog) => dialog.accept());
      const [cancelRes] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes(`/api/v1/requests/${createdReq.id}/cancel`) && r.request().method() === 'POST'
        ),
        cancelBtn.click(),
      ]);
      expect(cancelRes.status()).toBe(200);
      await expect(studentCard.getByText(/Отозвано|Отменено|Cancelled/i).first()).toBeVisible();

      // Staff reloads and sees cancelled status
      await staffPage.reload();
      await expect(staffCard.getByText(/Отозвано|Отменено|Cancelled/i).first()).toBeVisible();
    } finally {
      await staffCtx.close();
    }

    expect(errors).toEqual([]);
  });

  test('3. Staff targeted announcement via StudentDossierModal -> Student urgent banner & mark read -> Isolation & cleanup', async ({
    page,
    browser,
  }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';
    const uniqueTitle = `E2E Срочное Тимуру ${testInfo.project.name} ${Date.now()}`;
    let createdAnnId: string | null = null;

    await loginAs(page, 'dean.office@demo.edu', STAFF_PASSWORD);
    await expect(page.getByText(/Заявления и документы студентов|Student Requests & Documents/i)).toBeVisible();

    // Open Timur's StudentDossierModal directly from StaffDashboardPage request card to test user:id prefix fix
    const timurReqCard = page.locator('div.space-y-3 > div').filter({ hasText: /Тимур Белов/i }).first();
    await expect(timurReqCard).toBeVisible();
    await timurReqCard.getByRole('button', { name: /Личное дело|Student Dossier/i }).click();

    const dossierModal = getModalLocator(page);
    await expect(dossierModal.getByText(/Тимур Белов/i).first()).toBeVisible();
    await dossierModal.getByRole('button', { name: /Отправить персональное уведомление|Send Direct Notification/i }).click();

    const announceModal = getModalLocator(page);
    await expect(announceModal.getByText(/Публикация официального распоряжения|Publish Official Directive/i)).toBeVisible();
    const targetSelect = announceModal.locator('form select').first();
    await expect(targetSelect).toHaveValue(/^user:/);

    await announceModal.locator('form select').nth(1).selectOption('urgent');
    await announceModal.locator('form input[type="text"]').fill(uniqueTitle);
    await announceModal.locator('form textarea').fill('Срочно явиться в каб. 312 (E2E проверка).');

    const [annRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/staff/announcements') && r.request().method() === 'POST'),
      announceModal.getByRole('button', { name: /Опубликовать|Publish/i }).click(),
    ]);
    expect(annRes.status()).toBe(201);
    const annData = (await annRes.json()) as { id: string; count: number };
    createdAnnId = annData.id;
    expect(annData.count).toBe(1);

    const timurCtx = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
    const aigulCtx = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
    try {
      // Timur sees urgent banner on TodayPage & unread notification, then marks ONLY this notification read
      const timurPage = await timurCtx.newPage();
      await loginAs(timurPage, 'timur.belov@demo.edu', STUDENT_PASSWORD);
      await expect(timurPage.locator('main').getByText(uniqueTitle).first()).toBeVisible();

      await navigateStudentTab(timurPage, isMobile, 'notifications');
      const notifCard = timurPage.locator('main div.space-y-3 > div').filter({ hasText: uniqueTitle }).filter({
        has: timurPage.getByRole('button', { name: /Отметить прочитанным|Mark as read/i }),
      }).first();
      await expect(notifCard).toBeVisible();

      const [readRes] = await Promise.all([
        timurPage.waitForResponse((r) => r.url().includes('/read') && r.request().method() === 'POST'),
        notifCard.getByRole('button', { name: /Отметить прочитанным|Mark as read/i }).click(),
      ]);
      expect(readRes.status()).toBe(204);

      await navigateStudentTab(timurPage, isMobile, 'today');
      await expect(timurPage.locator('main').getByText(uniqueTitle)).toHaveCount(0);

      // Aigul (ДУ-101) must NOT receive Timur's targeted notification
      const aigulPage = await aigulCtx.newPage();
      await loginAs(aigulPage, 'aigul.nurova@demo.edu', STUDENT_PASSWORD);
      await navigateStudentTab(aigulPage, isMobile, 'notifications');
      await expect(aigulPage.locator('main').getByText(uniqueTitle)).toHaveCount(0);
    } finally {
      if (createdAnnId) {
        const origin = new URL(page.url()).origin;
        await page.request.delete(`${origin}/api/v1/staff/announcements/${createdAnnId}`).catch(() => {});
      }
      await timurCtx.close();
      await aigulCtx.close();
    }

    expect(errors).toEqual([]);
  });

  test('4. StaffDashboardPage sectionOverride navigation check via Sidebar / BottomNav', async ({ page }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';

    await loginAs(page, 'dean.office@demo.edu', STAFF_PASSWORD);
    await expect(page.getByText(/Заявления и документы студентов|Student Requests & Documents/i)).toBeVisible();

    // Click in-page Announcements toggle -> sets sectionOverride='announcements'
    await page.locator('main').getByRole('button', { name: /^(Объявления|Announcements) \(/i }).click();
    await expect(page.getByText(/Рассылки и объявления деканата|Опубликовать новое распоряжение|Announcements & Broadcasts|Publish a New Directive/i).first()).toBeVisible();

    // Now click Sidebar/BottomNav Requests tab -> view MUST switch back to Requests queue
    await navigateStaffTab(page, isMobile, 'staff_requests');
    await expect(page.getByText(/Все заявления \(|All Requests \(/i).first()).toBeVisible();

    // Reverse: click in-page Requests toggle, then click Sidebar/BottomNav Announcements tab
    await page.locator('main').getByRole('button', { name: /^(Заявления|Requests) \(/i }).click();
    await navigateStaffTab(page, isMobile, 'staff_actions');
    await expect(page.getByText(/Рассылки и объявления деканата|Опубликовать новое распоряжение|Announcements & Broadcasts|Publish a New Directive/i).first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('5. Staff schedule & exam update -> Student sees update + .ics download + Staff restore/reset', async ({
    page,
    browser,
  }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';
    const tempRoom = `А-999-E2E-${isMobile ? 'M' : 'D'}`;
    const tempExamRoom = `Зал-E2E-${isMobile ? 'M' : 'D'}`;

    await loginAs(page, 'dean.office@demo.edu', STAFF_PASSWORD);
    await navigateStaffTab(page, isMobile, 'schedule');

    // Ensure group ДУ-101 is selected
    const groupSelect = page.locator('main select').first();
    await groupSelect.selectOption('ДУ-101');
    await expect(page.getByText(/Дипломатический протокол/i).first()).toBeVisible();

    // Capture original first non-cancelled entry from API so we can restore exact baseline in finally
    const origin = new URL(page.url()).origin;
    const origScheduleRes = await page.request.get(`${origin}/api/v1/schedule?group=${encodeURIComponent('ДУ-101')}`);
    expect(origScheduleRes.status()).toBe(200);
    const origEntries = (await origScheduleRes.json()) as Array<{
      id: string;
      status: string;
      room: string;
      subject: string;
    }>;
    const targetEntry = origEntries.find((e) => e.status === 'normal') ?? origEntries[0];
    expect(targetEntry).toBeDefined();

    let mutatedScheduleId: string | null = null;
    let mutatedExam = false;
    const studentCtx = await browser.newContext({ viewport: page.viewportSize() ?? undefined });

    try {
      // Switch to Week view and open edit on the first non-cancelled entry
      await page.getByRole('button', { name: /Вся неделя|Week/i }).click();
      await page.locator('main').getByRole('button', { name: /^Изменить$|^Edit$/i }).first().click();

      const schModal = getModalLocator(page);
      await schModal.locator('select').selectOption('room_changed');
      await schModal.getByPlaceholder(/Например: Ауд\. 312|e\.g\. Room 312/i).fill(tempRoom);
      await schModal.locator('textarea').fill('E2E временная замена аудитории');
      const notifySchCheck = schModal.locator('#notifyCheck');
      if (!(await notifySchCheck.isChecked())) {
        await notifySchCheck.check();
      }

      const [schSaveRes, schReq] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/v1/staff/schedule-changes') && r.request().method() === 'POST'),
        page.waitForRequest((r) => r.url().includes('/api/v1/staff/schedule-changes') && r.method() === 'POST'),
        schModal.getByRole('button', { name: /Сохранить изменения|Save Changes/i }).click(),
      ]);
      expect(schSaveRes.status()).toBe(200);
      const schBody = schReq.postDataJSON() as { scheduleEntryId: string };
      mutatedScheduleId = schBody.scheduleEntryId;

      // Switch to Exams sub-tab and edit DIP-104
      await page.locator('main').getByRole('button', { name: /Экзамены и сессия|Exams & Session/i }).first().click();
      const dipCard = page.locator('div.space-y-3 > div').filter({ hasText: 'DIP-104' }).first();
      await expect(dipCard).toBeVisible();
      await dipCard.getByRole('button', { name: /Изменить дату \/ комиссию|Edit Date \/ Board/i }).click();

      const examModal = getModalLocator(page);
      await examModal.locator('select').first().selectOption('room_changed');
      await examModal.getByPlaceholder(/Главный корпус, ауд\. 312|Main Building, Room 312/i).fill(tempExamRoom);
      await examModal.locator('textarea').fill('E2E перенос экзамена в другой зал');
      const notifyExamCheck = examModal.locator('#notify-group-check');
      if (!(await notifyExamCheck.isChecked())) {
        await notifyExamCheck.check();
      }

      const [examSaveRes] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/v1/staff/exam-changes') && r.request().method() === 'POST'),
        examModal.getByRole('button', { name: /Утвердить изменения|Approve Changes/i }).click(),
      ]);
      expect(examSaveRes.status()).toBe(200);
      mutatedExam = true;

      // Student Aigul (ДУ-101) checks Notifications, Schedule Week, .ics export, and Exams tab
      const aigulPage = await studentCtx.newPage();
      await loginAs(aigulPage, 'aigul.nurova@demo.edu', STUDENT_PASSWORD);
      await navigateStudentTab(aigulPage, isMobile, 'notifications');
      await expect(aigulPage.locator('main').getByText(tempExamRoom).first()).toBeVisible();
      await expect(aigulPage.locator('main').getByText(/E2E временная замена аудитории/i).first()).toBeVisible();

      await navigateStudentTab(aigulPage, isMobile, 'schedule');
      await aigulPage.getByRole('button', { name: /Вся неделя|Week/i }).click();
      await expect(aigulPage.getByText(tempRoom).first()).toBeVisible();

      const [icsDownload] = await Promise.all([
        aigulPage.waitForEvent('download'),
        aigulPage.getByRole('button', { name: /Экспорт \.ICS|Export \.ICS|календарь \(\.ics\)|calendar \(\.ics\)/i }).click(),
      ]);
      const icsPath = await icsDownload.path();
      const icsText = fs.readFileSync(icsPath!, 'utf8');
      expect(icsText).toContain('BEGIN:VCALENDAR');
      expect(icsText).toContain('END:VCALENDAR');
      expect(icsText).toContain(tempRoom);
      expect(icsText).not.toContain('STATUS:CANCELLED');

      await aigulPage.locator('main').getByRole('button', { name: /Экзамены и сессия|Exams & Session/i }).first().click();
      await expect(aigulPage.getByText(tempExamRoom).first()).toBeVisible();
    } finally {
      if (mutatedScheduleId) {
        const matchedOrig = origEntries.find((e) => e.id === mutatedScheduleId);
        await page.request
          .post(`${origin}/api/v1/staff/schedule-changes`, {
            data: {
              scheduleEntryId: mutatedScheduleId,
              status: matchedOrig?.status || 'normal',
              room: matchedOrig?.room || 'А-204',
              note: '',
              notifyGroup: false,
            },
          })
          .catch(() => {});
      }
      if (mutatedExam) {
        await page.request.post(`${origin}/api/v1/staff/exams/DIP-104/reset`).catch(() => {});
      }
      await studentCtx.close();
    }

    expect(errors).toEqual([]);
  });

  test('6. GradesPage semester filter triggers /grades?semester=2 and prevents stale/fallback values', async ({
    page,
  }, testInfo) => {
    const errors = await attachErrorCollectors(page);
    const isMobile = testInfo.project.name === 'mobile-chromium';

    await loginAs(page, 'aigul.nurova@demo.edu', STUDENT_PASSWORD);
    await navigateStudentTab(page, isMobile, 'grades');

    await expect(page.locator('main').getByText('4.80').first()).toBeVisible();
    await expect(page.getByText(/8 дисциплин|8 courses/i)).toBeVisible();

    const [sem2Res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/grades?semester=2') && r.request().method() === 'GET'),
      page.getByRole('button', { name: /2 семестр|Semester 2/i }).click(),
    ]);
    expect(sem2Res.status()).toBe(200);

    await expect(page.getByText(/2 семестр • Дисциплины|Semester 2 • Curriculum/i)).toBeVisible();
    await expect(page.getByText(/0 дисциплин|0 courses/i)).toBeVisible();
    await expect(page.locator('main').getByText(/Дипломатический протокол/i)).toHaveCount(0);
    await expect(page.locator('main').getByText('88.5')).toHaveCount(0);
    await expect(page.locator('main').getByText(/^48$/)).toHaveCount(0);

    // Switch back to Semester 3 and verify 8 courses & 4.80 GPA restore
    const [sem3Res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/v1/grades') && r.request().method() === 'GET'),
      page.getByRole('button', { name: /3 семестр|Semester 3/i }).click(),
    ]);
    expect(sem3Res.status()).toBe(200);
    await expect(page.getByText(/8 дисциплин|8 courses/i)).toBeVisible();
    await expect(page.locator('main').getByText('4.80').first()).toBeVisible();

    expect(errors).toEqual([]);
  });
});
