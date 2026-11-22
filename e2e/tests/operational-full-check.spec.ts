import { test, expect, Page, BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'DemoStudent123!';
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD || 'DemoStaff123!';
const SCREENS_DIR = path.resolve(process.cwd(), '../docs/screens/operational-check');

async function saveScreen(page: Page, filename: string) {
  if (process.env.SAVE_SCREENS !== '1') return;
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREENS_DIR, filename), fullPage: false });
}

/**
 * Attaches console error and unhandled pageerror collectors.
 * Filters out expected initial 401s on unauthenticated state probes.
 */
function attachErrorCollectors(page: Page): string[] {
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

/**
 * Fills login form and authenticates.
 */
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByPlaceholder('student@demo.edu').fill(email);
  await page.getByPlaceholder('••••••••••••').fill(password);
  await page.getByRole('button', { name: /Войти в личный кабинет|Authenticate & Sign In/i }).click();
}

/**
 * Navigates to a student tab via desktop sidebar or mobile bottom nav.
 */
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

/**
 * Navigates to a staff tab via desktop sidebar or mobile bottom nav.
 */
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

/**
 * Returns top-most dialog/modal container.
 */
function getModalLocator(page: Page) {
  return page.locator('div.fixed.inset-0.z-50 > div, [role="dialog"]:not(.fixed.inset-0)').first();
}

test.describe('Full Operational Verification Suite (R1, R2, R3)', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // R1: MULTI-ACCOUNT END-TO-END WORKFLOW VERIFICATION
  // ───────────────────────────────────────────────────────────────────────────
  test('R1. Multi-account certificate lifecycle across 3 students and Dean Office staff', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(90_000);
    const isMobile = testInfo.project.name === 'mobile-chromium';
    const timestamp = Date.now();
    const aigulPurpose = `E2E Справка Aigul (${testInfo.project.name}-${timestamp})`;
    const timurPurpose = `ОВК Раменского района E2E Timur (${testInfo.project.name}-${timestamp})`;
    const linaHomeCity = `Самара E2E (${testInfo.project.name}-${timestamp})`;

    // Track created IDs for verification & cleanup
    let aigulRequestId: string | null = null;
    let timurRequestId: string | null = null;
    let linaRequestId: string | null = null;

    // 1. Authenticate 3 student accounts in separate browser contexts
    const aigulCtx = await browser.newContext();
    const timurCtx = await browser.newContext();
    const linaCtx = await browser.newContext();
    const staffCtx = await browser.newContext();

    const aigulPage = await aigulCtx.newPage();
    const timurPage = await timurCtx.newPage();
    const linaPage = await linaCtx.newPage();
    const staffPage = await staffCtx.newPage();

    const aigulErrors = attachErrorCollectors(aigulPage);
    const timurErrors = attachErrorCollectors(timurPage);
    const linaErrors = attachErrorCollectors(linaPage);
    const staffErrors = attachErrorCollectors(staffPage);

    try {
      // ── Step 1A: Aigul Nurova submits study_certificate ──────────────────
      await loginAs(aigulPage, 'aigul.nurova@demo.edu', STUDENT_PASSWORD);
      await expect(aigulPage.locator('main').getByText(/Айгуль/i).first()).toBeVisible();

      await navigateStudentTab(aigulPage, isMobile, 'requests');
      await aigulPage.getByRole('button', { name: /Подать новое заявление|Order Document/i }).click();

      let wizard = getModalLocator(aigulPage);
      await wizard.getByPlaceholder(/Например: Пенсионный фонд РФ/i).fill(aigulPurpose);
      await wizard.getByPlaceholder('1').fill('1');
      await wizard.locator('form select').selectOption('Электронный макет (PDF, демо)');

      const [aigulRes] = await Promise.all([
        aigulPage.waitForResponse((r) => r.url().includes('/api/v1/requests') && r.request().method() === 'POST'),
        wizard.getByRole('button', { name: /Отправить в деканат|Submit Request/i }).click(),
      ]);
      expect(aigulRes.status()).toBe(201);
      const aigulJson = (await aigulRes.json()) as { id: string };
      aigulRequestId = aigulJson.id;

      const aigulCard = aigulPage.locator('div.divide-y > div').filter({ hasText: aigulRequestId });
      await expect(aigulCard).toBeVisible();
      await expect(aigulCard.getByText(/Подано|Submitted/i).first()).toBeVisible();

      // ── Step 1B: Timur Belov submits military_certificate / transcript ─────
      await loginAs(timurPage, 'timur.belov@demo.edu', STUDENT_PASSWORD);
      await expect(timurPage.locator('main').getByText(/Тимур/i).first()).toBeVisible();

      await navigateStudentTab(timurPage, isMobile, 'requests');
      // Order military certificate from catalog cards
      const militaryCard = timurPage.locator('div.grid > div').filter({ hasText: /Справка для военкомата|военкомат/i }).first();
      await militaryCard.getByRole('button', { name: /Заказать|Request/i }).click();

      wizard = getModalLocator(timurPage);
      await wizard.locator('form input[type="text"]').first().fill(timurPurpose);
      await wizard.locator('form input[type="number"]').first().fill('1');
      const timurSelects = wizard.locator('form select');
      const timurSelCount = await timurSelects.count();
      for (let i = 0; i < timurSelCount; i++) {
        await timurSelects.nth(i).selectOption({ index: 1 });
      }

      const [timurRes] = await Promise.all([
        timurPage.waitForResponse((r) => r.url().includes('/api/v1/requests') && r.request().method() === 'POST'),
        wizard.getByRole('button', { name: /Отправить в деканат|Submit Request/i }).click(),
      ]);
      expect(timurRes.status()).toBe(201);
      const timurJson = (await timurRes.json()) as { id: string };
      timurRequestId = timurJson.id;

      const timurReqCard = timurPage.locator('div.divide-y > div').filter({ hasText: timurRequestId });
      await expect(timurReqCard).toBeVisible();
      await expect(timurReqCard.getByText(/Подано|Submitted/i).first()).toBeVisible();

      // ── Step 1C: Student 3 (Daniil Morozov, DU-101) submits dormitory_application
      // (preserves lina.okafor@demo.edu's 0-request seed-spec invariant for portal.spec.ts)
      await loginAs(linaPage, 'd.morozov@demo.edu', STUDENT_PASSWORD);
      await expect(linaPage.locator('main').getByText(/Даниил/i).first()).toBeVisible();

      await navigateStudentTab(linaPage, isMobile, 'requests');
      // Order dormitory application from catalog cards
      const dormCard = linaPage.locator('div.grid > div').filter({ hasText: /общежитии|dormitory/i }).first();
      await dormCard.getByRole('button', { name: /Заказать|Request/i }).click();

      wizard = getModalLocator(linaPage);
      await wizard.locator('form input[type="text"]').first().fill(linaHomeCity);
      const linaSelects = wizard.locator('form select');
      const linaSelCount = await linaSelects.count();
      for (let i = 0; i < linaSelCount; i++) {
        await linaSelects.nth(i).selectOption({ index: 1 });
      }

      const [linaRes] = await Promise.all([
        linaPage.waitForResponse((r) => r.url().includes('/api/v1/requests') && r.request().method() === 'POST'),
        wizard.getByRole('button', { name: /Отправить в деканат|Submit Request/i }).click(),
      ]);
      expect(linaRes.status()).toBe(201);
      const linaJson = (await linaRes.json()) as { id: string };
      linaRequestId = linaJson.id;

      const linaReqCard = linaPage.locator('div.divide-y > div').filter({ hasText: linaRequestId });
      await expect(linaReqCard).toBeVisible();
      await expect(linaReqCard.getByText(/Подано|Submitted/i).first()).toBeVisible();

      // ── Step 2: Staff Maria Volkova processes the student requests ────────
      await loginAs(staffPage, 'dean.office@demo.edu', STAFF_PASSWORD);
      await expect(staffPage.getByText(/Заявления и документы студентов|Student Requests & Documents/i)).toBeVisible();

      // Process Aigul's request: submitted -> in_review -> ready
      const staffAigulCard = staffPage.locator('div.space-y-3 > div').filter({ hasText: aigulRequestId });
      await expect(staffAigulCard).toBeVisible();

      // Transition to in_review
      await staffAigulCard.getByRole('button', { name: /Изменить статус|Update Status/i }).click();
      let staffModal = getModalLocator(staffPage);
      await staffModal.locator('select').selectOption('in_review');
      await staffModal.locator('textarea').fill('Заявление принято в работу сотрудником деканата (E2E)');
      const [reviewAigulRes] = await Promise.all([
        staffPage.waitForResponse(
          (r) => r.url().includes(`/api/v1/staff/requests/${aigulRequestId}/status`) && r.request().method() === 'POST'
        ),
        staffModal.getByRole('button', { name: /Утвердить и уведомить|Approve & Notify/i }).click(),
      ]);
      expect(reviewAigulRes.status()).toBe(200);

      // Transition to ready
      await staffAigulCard.getByRole('button', { name: /Изменить статус|Update Status/i }).click();
      staffModal = getModalLocator(staffPage);
      await staffModal.locator('select').selectOption('ready');
      await staffModal.locator('textarea').fill('Справка оформлена, заверена ЭЦП и готова к выдаче (E2E)');
      const [readyAigulRes] = await Promise.all([
        staffPage.waitForResponse(
          (r) => r.url().includes(`/api/v1/staff/requests/${aigulRequestId}/status`) && r.request().method() === 'POST'
        ),
        staffModal.getByRole('button', { name: /Утвердить и уведомить|Approve & Notify/i }).click(),
      ]);
      expect(readyAigulRes.status()).toBe(200);
      await expect(staffAigulCard.getByText(/Подписано ЭЦП|Готово|Ready|Signed/i).first()).toBeVisible();

      // Process Timur's military certificate: submitted -> in_review
      const staffTimurCard = staffPage.locator('div.space-y-3 > div').filter({ hasText: timurRequestId });
      await expect(staffTimurCard).toBeVisible();
      await staffTimurCard.getByRole('button', { name: /Изменить статус|Update Status/i }).click();
      staffModal = getModalLocator(staffPage);
      await staffModal.locator('select').selectOption('in_review');
      await staffModal.locator('textarea').fill('Справка для военкомата передана на подпись проректору (E2E)');
      const [reviewTimurRes] = await Promise.all([
        staffPage.waitForResponse(
          (r) => r.url().includes(`/api/v1/staff/requests/${timurRequestId}/status`) && r.request().method() === 'POST'
        ),
        staffModal.getByRole('button', { name: /Утвердить и уведомить|Approve & Notify/i }).click(),
      ]);
      expect(reviewTimurRes.status()).toBe(200);

      // Process Lina's dormitory request: submitted -> in_review
      const staffLinaCard = staffPage.locator('div.space-y-3 > div').filter({ hasText: linaRequestId });
      await expect(staffLinaCard).toBeVisible();
      await staffLinaCard.getByRole('button', { name: /Изменить статус|Update Status/i }).click();
      staffModal = getModalLocator(staffPage);
      await staffModal.locator('select').selectOption('in_review');
      await staffModal.locator('textarea').fill('Заявление передано в жилищно-бытовую комиссию (E2E)');
      const [reviewLinaRes] = await Promise.all([
        staffPage.waitForResponse(
          (r) => r.url().includes(`/api/v1/staff/requests/${linaRequestId}/status`) && r.request().method() === 'POST'
        ),
        staffModal.getByRole('button', { name: /Утвердить и уведомить|Approve & Notify/i }).click(),
      ]);
      expect(reviewLinaRes.status()).toBe(200);
      if (!isMobile) {
        await saveScreen(staffPage, '01-r1-staff-requests-processed.png');
      }

      // ── Step 3: Students verify status updates & Certificate Preview ──────
      // Aigul: status ready, opens PDF preview modal, verifies seal stamp, QR code, signature
      await aigulPage.reload();
      await navigateStudentTab(aigulPage, isMobile, 'requests');
      const updatedAigulCard = aigulPage.locator('div.divide-y > div').filter({ hasText: aigulRequestId });
      await expect(updatedAigulCard.getByText(/Подписано ЭЦП|Готово|Ready|Signed/i).first()).toBeVisible();

      await updatedAigulCard.getByRole('button', { name: /Подробнее|Details/i }).click();
      await expect(updatedAigulCard.getByText(/Справка оформлена, заверена ЭЦП/i)).toBeVisible();

      await updatedAigulCard.getByRole('button', { name: /Макет PDF|Preview PDF/i }).click();
      const previewModal = getModalLocator(aigulPage);
      await expect(previewModal.getByText(/ИЛЛЮСТРАТИВНЫЙ ШТАМП \(ДЕМО\)|ILLUSTRATIVE STAMP \(DEMO\)/i)).toBeVisible();
      await expect(previewModal.getByText(/Айгуль Нурова/i)).toBeVisible();
      await expect(previewModal.getByText(aigulPurpose)).toBeVisible();
      await expect(previewModal.getByText(/demotech\.edu\/verify/i)).toBeVisible();
      await expect(previewModal.getByText(/Сертификат:|Cert:/i)).toBeVisible();
      if (!isMobile) {
        await saveScreen(aigulPage, '02-r1-aigul-certificate-preview.png');
      }
      // Close preview modal
      await previewModal.getByRole('button', { name: /Закрыть|Close/i }).first().click();

      // Timur: status in_review verified
      await timurPage.reload();
      await navigateStudentTab(timurPage, isMobile, 'requests');
      const updatedTimurCard = timurPage.locator('div.divide-y > div').filter({ hasText: timurRequestId });
      await expect(updatedTimurCard.getByText(/В работе|В обработке|На рассмотрении|In Review/i).first()).toBeVisible();
      await updatedTimurCard.getByRole('button', { name: /Подробнее|Details/i }).click();
      await expect(updatedTimurCard.getByText(/передана на подпись проректору/i)).toBeVisible();

      // Lina: status in_review verified
      await linaPage.reload();
      await navigateStudentTab(linaPage, isMobile, 'requests');
      const updatedLinaCard = linaPage.locator('div.divide-y > div').filter({ hasText: linaRequestId });
      await expect(updatedLinaCard.getByText(/В работе|В обработке|На рассмотрении|In Review/i).first()).toBeVisible();
      await updatedLinaCard.getByRole('button', { name: /Подробнее|Details/i }).click();
      await expect(updatedLinaCard.getByText(/жилищно-бытовую комиссию/i)).toBeVisible();

    } finally {
      await aigulCtx.close();
      await timurCtx.close();
      await linaCtx.close();
      await staffCtx.close();
    }

    expect(aigulErrors).toEqual([]);
    expect(timurErrors).toEqual([]);
    expect(linaErrors).toEqual([]);
    expect(staffErrors).toEqual([]);
  });


  // ───────────────────────────────────────────────────────────────────────────
  // R2: SCHEDULE MANAGEMENT AND NOTIFICATIONS
  // ───────────────────────────────────────────────────────────────────────────
  test('R2. Staff schedule modification and announcement dispatch reflected in student views', async ({
    browser,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-chromium';
    const timestamp = Date.now();
    const tempRoom = `А-888-E2E-${isMobile ? 'M' : 'D'}-${timestamp % 10000}`;
    const newStartTime = '11:15';
    const newEndTime = '12:45';
    const scheduleNote = `E2E Перенос времени (${newStartTime}–${newEndTime}) и ауд. ${tempRoom} распоряжением деканата`;
    const announcementTitle = `Срочное распоряжение деканата ДУ-101 (E2E-${timestamp})`;
    const announcementBody = 'Всем студентам группы ДУ-101 предоставить зачетные книжки в каб. 312.';

    let mutatedScheduleId: string | null = null;
    let origScheduleBackup: { status: string; start: string; end: string; room: string } | null = null;
    let createdAnnouncementId: string | null = null;

    const staffCtx = await browser.newContext();
    const studentCtx = await browser.newContext();

    const staffPage = await staffCtx.newPage();
    const studentPage = await studentCtx.newPage();

    const staffErrors = attachErrorCollectors(staffPage);
    const studentErrors = attachErrorCollectors(studentPage);

    const origin = testInfo.project.use.baseURL || 'http://127.0.0.1:4176';

    try {
      // ── Step 1: Staff modifies schedule for group ДУ-101 ──────────────────
      await loginAs(staffPage, 'dean.office@demo.edu', STAFF_PASSWORD);
      await navigateStaffTab(staffPage, isMobile, 'schedule');

      // Ensure group ДУ-101 is selected
      const groupSelect = staffPage.locator('main select').first();
      await groupSelect.selectOption('ДУ-101');
      await expect(staffPage.getByText(/Дипломатический протокол/i).first()).toBeVisible();

      // Capture original normal schedule entry to restore in finally
      const origScheduleRes = await staffPage.request.get(`${origin}/api/v1/schedule?group=${encodeURIComponent('ДУ-101')}`);
      expect(origScheduleRes.status()).toBe(200);
      const origEntries = (await origScheduleRes.json()) as Array<{
        id: string;
        status: string;
        start: string;
        end: string;
        room: string;
        subject: string;
      }>;
      const targetEntry = origEntries.find((e) => e.status === 'normal') ?? origEntries[0];
      expect(targetEntry).toBeDefined();

      // Switch to Week view and click Edit on first entry
      await staffPage.getByRole('button', { name: /Вся неделя|Week/i }).click();
      await staffPage.locator('main').getByRole('button', { name: /^Изменить$|^Edit$/i }).first().click();

      const schModal = getModalLocator(staffPage);
      await schModal.locator('#edit-class-status-select').selectOption('moved');
      await schModal.locator('#edit-class-start-input').fill(newStartTime);
      await schModal.locator('#edit-class-end-input').fill(newEndTime);
      await schModal.locator('#edit-class-room-input').fill(tempRoom);
      await schModal.locator('#edit-class-note-textarea').fill(scheduleNote);
      const notifyCheck = schModal.locator('#notifyCheck');
      if (!(await notifyCheck.isChecked())) {
        await notifyCheck.check();
      }

      const [schSaveRes, schReq] = await Promise.all([
        staffPage.waitForResponse((r) => r.url().includes('/api/v1/staff/schedule-changes') && r.request().method() === 'POST'),
        staffPage.waitForRequest((r) => r.url().includes('/api/v1/staff/schedule-changes') && r.method() === 'POST'),
        schModal.getByRole('button', { name: /Сохранить изменения|Save Changes/i }).click(),
      ]);
      expect(schSaveRes.status()).toBe(200);
      const schBody = schReq.postDataJSON() as { scheduleEntryId: string };
      mutatedScheduleId = schBody.scheduleEntryId;
      const matchedOrig = origEntries.find((e) => e.id === mutatedScheduleId) ?? targetEntry;
      origScheduleBackup = {
        status: matchedOrig.status || 'normal',
        start: matchedOrig.start,
        end: matchedOrig.end,
        room: matchedOrig.room || 'А-204',
      };

      // ── Step 2: Staff sends urgent announcement to group ДУ-101 ───────────
      await navigateStaffTab(staffPage, isMobile, 'staff_actions');
      await expect(staffPage.getByText(/Рассылки и объявления деканата|Опубликовать новое распоряжение/i).first()).toBeVisible();

      // The announcement publisher form is rendered directly on page
      const announceForm = staffPage.locator('main form');
      await expect(announceForm).toBeVisible();

      await announceForm.locator('#announce-target-select').selectOption('ДУ-101');
      await announceForm.locator('#announce-priority-select').selectOption('urgent');
      await announceForm.locator('input[type="text"]').fill(announcementTitle);
      await announceForm.locator('textarea').fill(announcementBody);

      const [annRes] = await Promise.all([
        staffPage.waitForResponse((r) => r.url().includes('/api/v1/staff/announcements') && r.request().method() === 'POST'),
        announceForm.getByRole('button', { name: /Опубликовать и разослать|Publish & Broadcast/i }).click(),
      ]);
      expect(annRes.status()).toBe(201);
      const annJson = (await annRes.json()) as { id: string };
      createdAnnouncementId = annJson.id;

      // ── Step 3: Student in group ДУ-101 (Aigul) verifies schedule & notification
      await loginAs(studentPage, 'aigul.nurova@demo.edu', STUDENT_PASSWORD);
      await expect(studentPage.locator('main').getByText(/Айгуль/i).first()).toBeVisible();

      // Check urgent banner on TodayPage
      await navigateStudentTab(studentPage, isMobile, 'today');
      await expect(studentPage.locator('main').getByText(announcementTitle).first()).toBeVisible();

      // Check modified class time & room in Schedule (Week view)
      await navigateStudentTab(studentPage, isMobile, 'schedule');
      await studentPage.getByRole('button', { name: /Вся неделя|Week/i }).click();
      await expect(studentPage.getByText(tempRoom).first()).toBeVisible();
      await expect(studentPage.getByText(newStartTime).first()).toBeVisible();
      await expect(studentPage.getByText(newEndTime).first()).toBeVisible();
      if (!isMobile) {
        await saveScreen(studentPage, '03-r2-student-schedule-time-changed.png');
      }

      // Check Notifications tab
      await navigateStudentTab(studentPage, isMobile, 'notifications');
      await expect(studentPage.locator('main').getByText(announcementTitle).first()).toBeVisible();
      await expect(studentPage.locator('main').getByText(scheduleNote).first()).toBeVisible();
      if (!isMobile) {
        await saveScreen(studentPage, '04-r2-student-notifications.png');
      }

      // Mark the announcement notification as read
      const notifCard = studentPage
        .locator('main div.space-y-3 > div')
        .filter({ hasText: announcementTitle })
        .filter({ has: studentPage.getByRole('button', { name: /Отметить прочитанным|Mark as read/i }) })
        .first();
      await expect(notifCard).toBeVisible();
      await Promise.all([
        studentPage.waitForResponse((r) => r.url().includes('/read') && r.request().method() === 'POST'),
        notifCard.getByRole('button', { name: /Отметить прочитанным|Mark as read/i }).click(),
      ]);

      // Confirm urgent banner clears from TodayPage once read
      await navigateStudentTab(studentPage, isMobile, 'today');
      await expect(studentPage.locator('main').getByText(announcementTitle)).toHaveCount(0);

    } finally {
      // Restore mutated schedule entry back to baseline (original time, room, and status)
      if (mutatedScheduleId) {
        await staffPage.request
          .post(`${origin}/api/v1/staff/schedule-changes`, {
            data: {
              scheduleEntryId: mutatedScheduleId,
              status: origScheduleBackup?.status ?? 'normal',
              start: origScheduleBackup?.start ?? '09:00',
              end: origScheduleBackup?.end ?? '10:30',
              room: origScheduleBackup?.room ?? 'А-204',
              note: '',
              notifyGroup: false,
            },
          })
          .catch(() => {});
      }
      // Delete temporary announcement
      if (createdAnnouncementId) {
        await staffPage.request.delete(`${origin}/api/v1/staff/announcements/${createdAnnouncementId}`).catch(() => {});
      }
      await staffCtx.close();
      await studentCtx.close();
    }

    expect(staffErrors).toEqual([]);
    expect(studentErrors).toEqual([]);
  });


  // ───────────────────────────────────────────────────────────────────────────
  // R3: COMPREHENSIVE COVERAGE ACROSS ACCOUNTS AND PLATFORM
  // ───────────────────────────────────────────────────────────────────────────
  test('R3. Comprehensive coverage of Profile, Grades/Debts, Exams, AI Advisor, and Mobile responsiveness', async ({
    page,
    browser,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile-chromium';
    const errors = attachErrorCollectors(page);

    // ── 1. Profile section on Student account (Aigul) ────────────────────────
    await loginAs(page, 'aigul.nurova@demo.edu', STUDENT_PASSWORD);
    await expect(page.locator('main').getByText(/Айгуль/i).first()).toBeVisible();

    await navigateStudentTab(page, isMobile, 'profile');

    // Verify study form, group, student ID number, SNILS
    await expect(page.locator('main').getByText(/Бюджет|Budget/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/ДУ-101/).first()).toBeVisible();
    await expect(page.locator('main').getByText(/СТ-2023-0194/).first()).toBeVisible();

    // Verify Digital Student ID Modal (NFC + QR code pass)
    await page.getByRole('button', { name: /Электронный студенческий билет|Digital Student ID/i }).click();
    await expect(page.getByText(/симуляция NFC \/ QR-пропуска/i)).toBeVisible();

    // Simulate NFC tap
    await page.getByRole('button', { name: /Приложить к турникету \(Симуляция NFC\)/i }).click();
    await expect(page.getByText(/Проход через турникет разрешен/i)).toBeVisible({ timeout: 5000 });
    if (!isMobile) {
      await saveScreen(page, '05-r3-student-digital-id.png');
    }
    await page.getByRole('button', { name: /Закрыть|Close/i }).first().click();

    // ── 2. Grades & Credits section (Aigul: GPA 4.80, ECTS credits) ───────────
    await navigateStudentTab(page, isMobile, 'grades');
    await expect(page.locator('main').getByText('4.80').first()).toBeVisible();
    await expect(page.getByText(/8 дисциплин|8 courses/i)).toBeVisible();

    // ── 3. Exam timetable verification ──────────────────────────────────────
    await navigateStudentTab(page, isMobile, 'schedule');
    await page.locator('main').getByRole('button', { name: /Экзаменационная сессия|Экзамены|Exams/i }).first().click();
    await expect(page.getByText(/LAW-201|DIP-104/i).first()).toBeVisible();

    // ── 4. AI Academic Advisor interaction ──────────────────────────────────
    await page.getByRole('button', { name: /Консультант|Copilot/i }).first().click();
    const aiModal = getModalLocator(page);
    await aiModal.getByRole('button', { name: /Часы приема и контакты деканата\?/i }).click();
    await expect(aiModal.getByText(/кабинет 312|Каб\. 312|Room 312/i)).toBeVisible({ timeout: 10_000 });
    await aiModal.getByRole('button', { name: /Закрыть|Close/i }).first().click();

    // ── 5. Mobile 360px viewport responsiveness check ───────────────────────
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);

    if (isMobile) {
      await saveScreen(page, '06-r3-mobile-360px.png');
      const navButtons = page.locator('nav.fixed button');
      const count = await navButtons.count();
      expect(count).toBeGreaterThanOrEqual(4);
      for (let i = 0; i < count; i++) {
        const box = await navButtons.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
      }
    }

    // Logout Aigul
    await page.getByRole('button', { name: /Logout|Выйти/i }).click();
    await expect(page.getByPlaceholder('student@demo.edu')).toBeVisible();

    // ── 6. Student Timur Belov: Academic debt warning in Statistics ──────────
    await loginAs(page, 'timur.belov@demo.edu', STUDENT_PASSWORD);
    await expect(page.locator('main').getByText(/Тимур/i).first()).toBeVisible();

    await navigateStudentTab(page, isMobile, 'grades');
    await expect(page.getByText(/Академическая задолженность: Статистика/i)).toBeVisible();
    await expect(page.getByText(/Комиссионная пересдача/i).first()).toBeVisible();

    // Logout Timur
    await page.getByRole('button', { name: /Logout|Выйти/i }).click();
    await expect(page.getByPlaceholder('student@demo.edu')).toBeVisible();

    // ── 7. Staff account profile verification ────────────────────────────────
    await loginAs(page, 'dean.office@demo.edu', STAFF_PASSWORD);
    await expect(page.getByText(/Заявления и документы студентов|Служебная панель/i).first()).toBeVisible();

    await navigateStaffTab(page, isMobile, 'profile');
    await expect(page.locator('main').getByText(/Мария Волкова|Сотрудник деканата/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/Каб\. 312|Rm 312/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/ТАБ-0441/).first()).toBeVisible();

    // Verify Staff Groups & Student Dossier directory
    await navigateStaffTab(page, isMobile, 'staff_students');
    await expect(page.locator('main').getByText(/Академические группы|Academic Groups/i).first()).toBeVisible();
    await expect(page.locator('main').getByText(/ДУ-101/).first()).toBeVisible();
    await expect(page.locator('main').getByText(/ДУ-205/).first()).toBeVisible();

    // Mandatory competition disclaimer check in footer
    await expect(page.getByText(/Конкурсный концепт/i).first()).toBeVisible();

    expect(errors).toEqual([]);
  });

});
