import { test, expect, BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'DemoStudent123!';
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD || 'DemoStaff123!';

async function loginContext(ctx: BrowserContext, origin: string, email: string, password: string) {
  const res = await ctx.request.post(`${origin}/api/v1/auth/login`, {
    data: { email, password },
  });
  expect(res.status(), `API login failed for ${email}`).toBe(200);
}

test.describe('Security, Real Backend RBAC/IDOR & PWA Compliance Audit', () => {
  test('PWA manifest and offline service worker are served cleanly', async ({ request }) => {
    const manifestRes = await request.get('/manifest.webmanifest');
    expect(manifestRes.status()).toBe(200);
    const manifest = await manifestRes.json();
    expect(manifest.short_name).toBe('DemoTech');
    expect(manifest.display).toBe('standalone');

    const swRes = await request.get('/sw.js');
    expect(swRes.status()).toBe(200);
    const swBody = await swRes.text();
    expect(swBody).toContain('demotech-dean-v1');
    expect(swBody).toContain('/api/');
  });

  test('Built production frontend bundle contains zero server secrets or mock auth code', async () => {
    const distDir = path.resolve(process.cwd(), '../frontend/dist');
    expect(fs.existsSync(distDir)).toBe(true);

    const files: string[] = [];
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(js|css|html)$/.test(entry.name)) files.push(full);
      }
    }
    walk(distDir);
    expect(files.length).toBeGreaterThan(0);

    const forbiddenPatterns = [
      /JWT_SECRET/i,
      /COOKIE_SECRET/i,
      /AI_API_KEY/i,
      /OPENAI_API_KEY/i,
      /AI_BASE_URL/i,
      /DATABASE_URL/i,
      /DIRECT_URL/i,
      /postgresql:\/\//i,
      /BEGIN RSA PRIVATE KEY/i,
      /TEST_USERS/,
      /X-DemoTech-Offline-Mock/,
      /dean_mock_/,
      /dean_current_user/,
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of forbiddenPatterns) {
        expect(pattern.test(content), `Forbidden pattern ${pattern} found in ${file}`).toBe(false);
      }
    }
  });

  test('Real backend sets httpOnly cookie, enforces RBAC/IDOR, and stores zero JWTs in localStorage', async ({ page }) => {
    // 1. Wrong password gets real 401 from backend
    const badLogin = await page.request.post('/api/v1/auth/login', {
      data: { email: 'aigul.nurova@demo.edu', password: 'WrongPassword!' },
    });
    expect(badLogin.status()).toBe(401);

    // 2. Real UI login
    await page.goto('/');
    await page.getByPlaceholder('student@demo.edu').fill('aigul.nurova@demo.edu');
    await page.getByPlaceholder('••••••••••••').fill(STUDENT_PASSWORD);
    await page.getByRole('button', { name: /Войти в личный кабинет/i }).click();

    await expect(page.locator('main').getByText(/Айгуль/i).first()).toBeVisible();

    // 3. Verify httpOnly cookie is set in browser context & invisible to document.cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'dean_session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie!.httpOnly).toBe(true);
    expect(sessionCookie!.sameSite).toBe('Lax');

    const docCookie = await page.evaluate(() => document.cookie);
    expect(docCookie).not.toContain('dean_session');

    // 4. Zero JWTs or mock state in localStorage or sessionStorage (case-insensitive)
    const storageDump = await page.evaluate(() =>
      JSON.stringify({ local: window.localStorage, session: window.sessionStorage }),
    );
    expect(storageDump).not.toMatch(/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}/);
    expect(storageDump.toLowerCase()).not.toContain('access_token');
    expect(storageDump.toLowerCase()).not.toContain('jwt');
    expect(storageDump.toLowerCase()).not.toContain('dean_current_user');

    // 5. Helmet security headers & strict CORS rejection for untrusted Origin
    const healthCorsRes = await page.request.get('/api/v1/health', {
      headers: { Origin: 'https://evil.example' },
    });
    expect(healthCorsRes.status()).toBe(200);
    const secHeaders = healthCorsRes.headers();
    expect(secHeaders['x-content-type-options']).toBe('nosniff');
    expect(secHeaders['x-frame-options']).toBeTruthy();
    expect(secHeaders['access-control-allow-origin']).not.toBe('https://evil.example');
    expect(secHeaders['access-control-allow-origin']).not.toBe('*');

    // 6. Real backend RBAC: student receives 403 on staff routes
    const staffReq = await page.request.get('/api/v1/staff/requests');
    expect(staffReq.status()).toBe(403);
    const staffStudents = await page.request.get('/api/v1/staff/students');
    expect(staffStudents.status()).toBe(403);

    // 7. Real backend IDOR: foreign or invalid request ID returns 404
    const foreignReq = await page.request.get('/api/v1/requests/00000000-0000-4000-8000-000000000099');
    expect(foreignReq.status()).toBe(404);

    // 8. Logout clears dean_session cookie and revokes subsequent /auth/me access
    const logoutRes = await page.request.post('/api/v1/auth/logout');
    expect(logoutRes.status()).toBe(204);
    const postLogoutCookies = await page.context().cookies();
    const postLogoutSession = postLogoutCookies.find((c) => c.name === 'dean_session');
    expect(postLogoutSession?.value ?? '').toBe('');
    const postLogoutMe = await page.request.get('/api/v1/auth/me');
    expect(postLogoutMe.status()).toBe(401);
  });

  test('Tier 2 API security & contract boundaries: 401 unauth, 403 RBAC, 404 IDOR, 409 conflicts, 422 validation, and AI Copilot isolation', async ({ browser }, testInfo) => {
    const origin = testInfo.project.use.baseURL || 'http://127.0.0.1:4176';

    const unauthCtx = await browser.newContext();
    const aigulCtx = await browser.newContext();
    const staffCtx = await browser.newContext();
    const timurCtx = await browser.newContext();
    const linaCtx = await browser.newContext();

    try {
      // 1. Unauthenticated 401 across all protected endpoints
      const unauthGetEndpoints = [
        '/api/v1/auth/me',
        '/api/v1/profile',
        '/api/v1/schedule',
        '/api/v1/schedule/today',
        '/api/v1/exams',
        '/api/v1/grades',
        '/api/v1/request-types',
        '/api/v1/requests',
        '/api/v1/notifications',
        '/api/v1/staff/requests',
      ];
      for (const ep of unauthGetEndpoints) {
        const res = await unauthCtx.request.get(`${origin}${ep}`);
        expect(res.status(), `Expected 401 on unauthenticated GET ${ep}`).toBe(401);
      }
      const unauthAsk = await unauthCtx.request.post(`${origin}/api/v1/assistant/ask`, {
        data: { question: 'When is my retake?', lang: 'en' },
      });
      expect(unauthAsk.status()).toBe(401);

      const unauthPostEndpoints: Array<{ path: string; data?: Record<string, unknown> }> = [
        {
          path: '/api/v1/requests',
          data: { typeCode: 'study_certificate', data: { purpose: 'Unauth', copies: '1', delivery: 'PDF' } },
        },
        { path: '/api/v1/notifications/read-all' },
        { path: '/api/v1/staff/announcements', data: { title: 'Unauth', body: 'Unauth' } },
      ];
      for (const item of unauthPostEndpoints) {
        const res = await unauthCtx.request.post(`${origin}${item.path}`, {
          ...(item.data ? { data: item.data } : {}),
        });
        expect(res.status(), `Expected 401 on unauthenticated POST ${item.path}`).toBe(401);
      }

      // Tampered JWT cookie returns 401
      const tamperedRes = await unauthCtx.request.get(`${origin}/api/v1/auth/me`, {
        headers: { Cookie: 'dean_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjMifQ.' },
      });
      expect(tamperedRes.status()).toBe(401);

      // Malformed login payload returns 422
      const badLoginPayload = await unauthCtx.request.post(`${origin}/api/v1/auth/login`, {
        data: { email: 'not-an-email', password: '' },
      });
      expect(badLoginPayload.status()).toBe(422);

      // Authenticate role sessions once each (no rate-limit thrashing)
      await loginContext(aigulCtx, origin, 'aigul.nurova@demo.edu', STUDENT_PASSWORD);
      await loginContext(staffCtx, origin, 'dean.office@demo.edu', STAFF_PASSWORD);
      await loginContext(timurCtx, origin, 'timur.belov@demo.edu', STUDENT_PASSWORD);
      await loginContext(linaCtx, origin, 'lina.okafor@demo.edu', STUDENT_PASSWORD);

      // 2. RBAC 403: Student calling all /staff/* endpoints + Staff calling POST /requests
      const fakeUuid = '00000000-0000-4000-8000-000000000099';
      const studentStaffGetChecks = [
        '/api/v1/staff/requests',
        '/api/v1/staff/announcements',
        '/api/v1/staff/exams',
        '/api/v1/staff/groups',
        `/api/v1/staff/groups/${encodeURIComponent('ДУ-101')}/students`,
        '/api/v1/staff/students',
        `/api/v1/staff/students/${fakeUuid}/dossier`,
      ];
      for (const ep of studentStaffGetChecks) {
        const res = await aigulCtx.request.get(`${origin}${ep}`);
        expect(res.status(), `Expected 403 for student GET ${ep}`).toBe(403);
      }

      const studentStaffPostChecks: Array<{ path: string; data?: Record<string, unknown> }> = [
        { path: `/api/v1/staff/requests/${fakeUuid}/status`, data: { status: 'in_review' } },
        { path: '/api/v1/staff/announcements', data: { title: 'Test', body: 'Body' } },
        { path: '/api/v1/staff/schedule-changes', data: { scheduleEntryId: fakeUuid, status: 'normal' } },
        {
          path: '/api/v1/staff/exams',
          data: {
            code: 'TEST-999',
            groupId: 'ДУ-101',
            subject: 'Test',
            format: 'Oral',
            examiner: 'Prof',
            date: '2026-12-30',
            time: '10:00',
            room: '101',
          },
        },
        { path: '/api/v1/staff/exams/LAW-201/reset' },
        { path: '/api/v1/staff/exam-changes', data: { examId: 'LAW-201', status: 'scheduled' } },
      ];
      for (const item of studentStaffPostChecks) {
        const res = await aigulCtx.request.post(`${origin}${item.path}`, {
          ...(item.data ? { data: item.data } : {}),
        });
        expect(res.status(), `Expected 403 for student POST ${item.path}`).toBe(403);
      }

      const studentStaffDel = await aigulCtx.request.delete(`${origin}/api/v1/staff/announcements/${fakeUuid}`);
      expect(studentStaffDel.status()).toBe(403);

      const staffCreateReq = await staffCtx.request.post(`${origin}/api/v1/requests`, {
        data: {
          typeCode: 'study_certificate',
          data: { purpose: 'Test', copies: '1', delivery: 'Электронный макет (PDF, демо)' },
        },
      });
      expect(staffCreateReq.status()).toBe(403);

      // 3. IDOR 404 & Missing/Non-UUID 404
      const timurReqsRes = await timurCtx.request.get(`${origin}/api/v1/requests`);
      expect(timurReqsRes.status()).toBe(200);
      const timurReqs = (await timurReqsRes.json()) as { items: Array<{ id: string; status: string }> };
      expect(timurReqs.items.length).toBeGreaterThan(0);
      const timurReqId = timurReqs.items[0].id;

      const linaNotifsRes = await linaCtx.request.get(`${origin}/api/v1/notifications`);
      expect(linaNotifsRes.status()).toBe(200);
      const linaNotifs = (await linaNotifsRes.json()) as { items: Array<{ id: string }> };
      expect(linaNotifs.items.length).toBeGreaterThan(0);
      const linaNotifId = linaNotifs.items[0].id;

      expect((await aigulCtx.request.get(`${origin}/api/v1/requests/${timurReqId}`)).status()).toBe(404);
      expect((await aigulCtx.request.post(`${origin}/api/v1/requests/${timurReqId}/cancel`)).status()).toBe(404);
      expect((await aigulCtx.request.post(`${origin}/api/v1/notifications/${linaNotifId}/read`)).status()).toBe(404);

      expect((await aigulCtx.request.get(`${origin}/api/v1/requests/not-a-uuid`)).status()).toBe(404);
      expect((await aigulCtx.request.post(`${origin}/api/v1/requests/not-a-uuid/cancel`)).status()).toBe(404);
      expect((await aigulCtx.request.post(`${origin}/api/v1/notifications/bad/read`)).status()).toBe(404);

      expect((await staffCtx.request.get(`${origin}/api/v1/staff/students/not-a-uuid/dossier`)).status()).toBe(404);
      expect((await staffCtx.request.delete(`${origin}/api/v1/staff/announcements/${fakeUuid}`)).status()).toBe(404);
      expect(
        (
          await staffCtx.request.post(`${origin}/api/v1/staff/requests/${fakeUuid}/status`, {
            data: { status: 'in_review' },
          })
        ).status(),
      ).toBe(404);
      expect(
        (
          await staffCtx.request.post(`${origin}/api/v1/staff/exam-changes`, {
            data: { examId: 'NO-SUCH-EXAM-999', status: 'room_changed', room: '101', notifyGroup: false },
          })
        ).status(),
      ).toBe(404);
      expect((await staffCtx.request.post(`${origin}/api/v1/staff/exams/UNKNOWN/reset`)).status()).toBe(404);
      expect((await staffCtx.request.get(`${origin}/api/v1/staff/groups/NO-SUCH-GROUP/students`)).status()).toBe(404);

      // 4. Conflict 409: invalid cancel (needs_info / ready) & invalid staff transition (submitted -> ready)
      const timurNeedsInfo = timurReqs.items.find((r) => r.status === 'needs_info');
      const timurReady = timurReqs.items.find((r) => r.status === 'ready');
      expect(timurNeedsInfo).toBeDefined();
      expect(timurReady).toBeDefined();

      expect((await timurCtx.request.post(`${origin}/api/v1/requests/${timurNeedsInfo!.id}/cancel`)).status()).toBe(409);
      expect((await timurCtx.request.post(`${origin}/api/v1/requests/${timurReady!.id}/cancel`)).status()).toBe(409);

      const tempReqRes = await aigulCtx.request.post(`${origin}/api/v1/requests`, {
        data: {
          typeCode: 'study_certificate',
          data: {
            purpose: `E2E 409 Conflict Check (${testInfo.project.name})`,
            copies: '1',
            delivery: 'Электронный макет (PDF, демо)',
          },
        },
      });
      expect(tempReqRes.status()).toBe(201);
      const tempReq = (await tempReqRes.json()) as { id: string };
      try {
        const invalidJump = await staffCtx.request.post(`${origin}/api/v1/staff/requests/${tempReq.id}/status`, {
          data: { status: 'ready', comment: 'Should be rejected' },
        });
        expect(invalidJump.status()).toBe(409);
      } finally {
        const cleanupCancel = await aigulCtx.request.post(`${origin}/api/v1/requests/${tempReq.id}/cancel`);
        expect(cleanupCancel.status()).toBe(200);
      }

      // 5. Validation 422 on invalid queries & bodies
      expect((await aigulCtx.request.get(`${origin}/api/v1/grades?semester=0`)).status()).toBe(422);
      expect((await aigulCtx.request.get(`${origin}/api/v1/schedule?date=invalid`)).status()).toBe(422);
      expect((await aigulCtx.request.post(`${origin}/api/v1/assistant/ask`, { data: { question: '', lang: 'ru' } })).status()).toBe(422);
      expect((await aigulCtx.request.post(`${origin}/api/v1/assistant/ask`, { data: { question: 'a'.repeat(501), lang: 'ru' } })).status()).toBe(422);
      expect((await aigulCtx.request.post(`${origin}/api/v1/requests`, { data: { typeCode: 'unknown_code', data: {} } })).status()).toBe(422);
      expect((await aigulCtx.request.post(`${origin}/api/v1/requests`, { data: { typeCode: 'study_certificate', data: {} } })).status()).toBe(422);
      expect([404, 422]).toContain(
        (
          await staffCtx.request.post(`${origin}/api/v1/staff/schedule-changes`, {
            data: { scheduleEntryId: 'not-a-uuid', status: 'normal' },
          })
        ).status(),
      );
      expect([404, 422]).toContain(
        (
          await staffCtx.request.post(`${origin}/api/v1/staff/announcements`, {
            data: { title: 'Test', body: 'Body', targetUserId: 'not-a-uuid' },
          })
        ).status(),
      );

      // 6. AI Copilot strict per-user data isolation
      const aigulAskRes = await aigulCtx.request.post(`${origin}/api/v1/assistant/ask`, {
        data: { question: 'Есть ли у меня задолженности или пересдача по статистике?', lang: 'ru' },
      });
      expect(aigulAskRes.status()).toBe(200);
      const aigulAsk = (await aigulAskRes.json()) as { answer: string; source: string };
      expect(aigulAsk.answer).not.toMatch(/Статистика|А-314|2026-11-28|\b48\b/i);

      const timurAskRes = await timurCtx.request.post(`${origin}/api/v1/assistant/ask`, {
        data: { question: 'Когда у меня пересдача по статистике?', lang: 'ru' },
      });
      expect(timurAskRes.status()).toBe(200);
      const timurAsk = (await timurAskRes.json()) as { answer: string };
      expect(timurAsk.answer).toMatch(/Статистика/i);
    } finally {
      await Promise.all([
        unauthCtx.close(),
        aigulCtx.close(),
        staffCtx.close(),
        timurCtx.close(),
        linaCtx.close(),
      ]);
    }
  });
});
