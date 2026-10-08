import { defineConfig, devices } from '@playwright/test';

// Pre-migration visual reference (Tailwind 3 -> 4 safety net). Deliberately separate from the
// per-PR suite: pixel baselines depend on the machine's fonts and rasteriser, so they are
// compared only in the environment that produced them (see docs/ops/ooh-earth/26-VISUAL-BASELINES.md).
// Provider-network tests are a different suite; everything here is stubbed and offline.
const PORT = 4173;

export default defineConfig({
  testDir: './e2e/visual',
  snapshotPathTemplate: '{testDir}/__baselines__/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      // Tight on purpose: a migration difference must be seen and reviewed by a person.
      maxDiffPixelRatio: 0.002,
    },
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
