import { test, expect } from '@playwright/test';

// Boots the production build and confirms the shell actually renders —
// catches the class of regression build/typecheck/lint can't see: a blank
// screen from a runtime error in the client-side render path.
//
// CI has no live Base44 backend (VITE_BASE44_APP_BASE_URL is intentionally
// unset — no secrets in this workflow, see CLAUDE.md rule #4), so every
// Base44Error / 404-on-fetch console entry here is an *expected* offline
// artifact, not a regression. We only fail on signals that mean the React
// tree itself crashed.
const CRASH_SIGNALS = [/Uncaught/i, /ReferenceError/i, /is not a function/i, /is not defined/i];

test.describe('smoke', () => {
  test('home page loads and renders the app shell', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    await expect(page).toHaveTitle(/OOH/i);
    await expect(page.locator('#root')).not.toBeEmpty();

    const crashes = consoleErrors.filter((e) => CRASH_SIGNALS.some((re) => re.test(e)));
    expect(crashes, `Client-side crash detected:\n${crashes.join('\n')}`).toEqual([]);
  });

  test('about page is reachable', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('#root')).not.toBeEmpty();
  });
});
