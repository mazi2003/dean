import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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
    await page.getByPlaceholder('••••••••••••').fill('DemoStudent123!');
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

    // 4. Zero JWTs or mock state in localStorage
    const storageDump = await page.evaluate(() => JSON.stringify(window.localStorage));
    expect(storageDump).not.toMatch(/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}/);
    expect(storageDump).not.toContain('access_token');
    expect(storageDump).not.toContain('jwt');
    expect(storageDump).not.toContain('dean_current_user');

    // 5. Real backend RBAC: student receives 403 on staff routes
    const staffReq = await page.request.get('/api/v1/staff/requests');
    expect(staffReq.status()).toBe(403);
    const staffStudents = await page.request.get('/api/v1/staff/students');
    expect(staffStudents.status()).toBe(403);

    // 6. Real backend IDOR: foreign or invalid request ID returns 404
    const foreignReq = await page.request.get('/api/v1/requests/00000000-0000-4000-8000-000000000099');
    expect(foreignReq.status()).toBe(404);
  });
});
