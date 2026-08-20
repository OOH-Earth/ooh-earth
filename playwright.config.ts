import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['github'],
        ['json', { outputFile: 'playwright-report/report.json' }],
      ]
    : [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Chromium-backed mobile device (not iPhone 13, which defaults to
      // WebKit) — keeps this to a single installed browser engine. Scoped to
      // the mocked feature specs only: smoke.spec.ts and a11y.spec.ts are
      // pre-existing, desktop-only-baselined gates (see a11y-baseline.json)
      // — running them at a new viewport would surface pre-existing,
      // site-wide issues (e.g. an icon-only Nav CTA) as false "regressions"
      // unrelated to this feature. Mobile coverage for those is a separate,
      // deliberate follow-up, not a side effect of this feature's tests.
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testMatch: [
        'location-detail.spec.ts',
        'multi-photo-upload.spec.ts',
        'verify-reject-workflow.spec.ts',
        'focus-trap.spec.ts',
        'nav-menu-disclosure.spec.ts',
        'dashboard-location-links.spec.ts',
      ],
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
