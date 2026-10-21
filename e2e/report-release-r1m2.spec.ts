import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// Release-gate checks for the credibility/demo-readiness candidate. Mocked
// backend only: these prove client behaviour, not live submission or camera
// capture.

test.describe('report flow without a photo (mock write path)', () => {
  test('an optional-photo report saves as pending with no photo and no photo error', async ({
    page,
  }) => {
    const db: MockDb = { user: null, locations: {} };
    await mockBase44(page, db);
    await page.goto('/report');

    await page.getByPlaceholder('Street, district, city').fill('900 Test Ave, Testville');
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.50');

    const submit = page.locator('button[type="submit"]');
    await submit.click();
    await submit.click();
    await submit.click();
    await expect(submit).toHaveText(/Transmit report/i);
    await submit.click();

    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/not public and will not appear on the map until a moderator/i),
    ).toBeVisible();
    await expect(page.getByText(/photo.*required/i)).toHaveCount(0);

    const saved = Object.values(db.locations ?? {});
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ status: 'pending', lat: 13.75, lng: 100.5 });
    expect(saved[0].image_url || '').toBe('');
  });
});

test.describe('short landscape and keyboard behaviour on /report', () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test('no funding prompt, page scrolls, guidance is reachable and not covered', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/report');
    await page.waitForTimeout(3000);
    await expect(page.getByText('Fuel the next action window')).toHaveCount(0);

    const guidance = page.getByTestId('photo-privacy-guidance');
    await guidance.scrollIntoViewIfNeeded();
    await expect(guidance).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    // The guidance text is not hidden behind a fixed bar at its own centre point.
    const covered = await guidance.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + Math.min(r.height / 2, 12),
      );
      return !(top && (el === top || el.contains(top)));
    });
    expect(covered).toBe(false);

    // Page can be scrolled to the bottom (nothing traps scrolling).
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const atBottom = await page.evaluate(
      () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2,
    );
    expect(atBottom).toBe(true);
  });

  test('keyboard users can reach the photo controls', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/report');
    let reached = false;
    for (let i = 0; i < 80 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        const label = a?.closest('label');
        return /Upload|Capture live/i.test(
          label?.getAttribute('aria-label') || a?.getAttribute('aria-label') || '',
        );
      });
    }
    expect(reached).toBe(true);
  });
});
