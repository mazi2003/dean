import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Security & PWA Compliance Audit', () => {
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
    expect(swBody).toContain("/api/");
  });

  test('Built production frontend bundle contains zero server secrets or internal keys', async () => {
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
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of forbiddenPatterns) {
        expect(pattern.test(content), `Forbidden secret pattern ${pattern} found in ${file}`).toBe(false);
      }
    }
  });

  test('No JWT or access tokens are ever persisted in localStorage', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('student@demo.edu').fill('aigul.nurova@demo.edu');
    await page.getByPlaceholder('••••••••••••').fill('DemoStudent123!');
    await page.getByRole('button', { name: /Войти в личный кабинет/i }).click();

    await page.waitForTimeout(500);
    const storageDump = await page.evaluate(() => JSON.stringify(window.localStorage));
    // Verify no JWT header signature (`eyJ...eyJ...`) or `token` secret key exists
    expect(storageDump).not.toMatch(/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}/);
    expect(storageDump).not.toContain('access_token');
    expect(storageDump).not.toContain('jwt');
  });
});
