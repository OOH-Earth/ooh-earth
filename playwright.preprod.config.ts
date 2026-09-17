import { defineConfig, devices } from '@playwright/test';
import { PREPROD_BACKUP_BASE_URL } from './e2e/preprod/fixtures/preprodAuth';

// Real-backend pre-production suite. Unlike playwright.config.ts (fully
// mocked -- no live Base44 backend, no webServer needed beyond a local
// static preview of the built app), this config points a real browser at
// the actually-deployed BACKUP Base44 application and never intercepts
// Base44 network traffic. There is no webServer here: BACKUP is already
// running at PREPROD_BACKUP_BASE_URL once `npm run release:backup --
// --execute` has deployed a candidate there.
//
// See docs/TESTING_AND_RELEASE.md for the two-layer test model this
// config exists to keep distinct from playwright.config.ts, and for what
// each layer does and does not prove.
export default defineConfig({
  testDir: './e2e/preprod',
  fullyParallel: false, // real shared backend state; avoid cross-test interference
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report-preprod', open: 'never' }],
        ['github'],
        ['json', { outputFile: 'playwright-report-preprod/report.json' }],
      ]
    : [['html', { outputFolder: 'playwright-report-preprod', open: 'never' }]],
  use: {
    baseURL: PREPROD_BACKUP_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
