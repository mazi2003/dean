import { existsSync } from 'node:fs';
import { chromium, defineConfig, devices } from '@playwright/test';

const resolveBrowserChannel = (): 'chrome' | 'msedge' | undefined => {
  if (process.env.PLAYWRIGHT_CHANNEL === 'chrome' || process.env.PLAYWRIGHT_CHANNEL === 'msedge') {
    return process.env.PLAYWRIGHT_CHANNEL;
  }
  if (existsSync(chromium.executablePath())) {
    return undefined;
  }
  if (existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
    return 'chrome';
  }
  if (existsSync('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe')) {
    return 'msedge';
  }
  return undefined;
};

const browserChannel = resolveBrowserChannel();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4176',
    ...(browserChannel ? { channel: browserChannel } : {}),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 740 },
      },
    },
  ],
  webServer: {
    command: 'node ../scripts/local-stack.mjs',
    url: 'http://127.0.0.1:4176',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
