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
    // trace is deliberately OFF here, unlike playwright.config.ts. Every
    // authenticated request in this suite carries a real
    // `Authorization: Bearer <token>` header (see @base44/sdk's
    // axios-client.js) for one of the real PREPROD_*_TOKEN secrets --
    // Playwright's trace format records full request/response headers for
    // every network call, so a trace.zip artifact from this suite would
    // embed the live token in a file anyone with read access to the
    // workflow run's artifacts could download. Video/screenshot are safe
    // (rendered pixels only, no header/network data) and stay on for
    // failure diagnosis.
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
