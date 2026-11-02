import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Regression: the result card's "view listing" link (a non-shrinking sibling) sat on top of the Claim
// button, so Claim was unclickable (elementFromPoint at its centre was the link; click timed out).
// Real mouse clicks, real hit-testing. Mock backend only; the claim itself is never submitted.
for (const w of [1280, 1024]) {
  test(`adbusting: Claim is the topmost control at its centre and opens its dialog @${w}`, async ({
    page,
  }) => {
    await page.route('**/api/**', (r) =>
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
    );
    const locs: Record<string, unknown> = {};
    for (let i = 0; i < 4; i++)
      locs['l' + i] = {
        id: 'l' + i,
        title:
          i === 0
            ? 'A deliberately very long adbusting location title that must wrap inside its column'
            : `Spot ${i}`,
        type: 'billboard',
        address: `${i} Field Way`,
        lat: 13.75 + i * 0.001,
        lng: 100.5 + i * 0.001,
        status: 'pending',
        created_date: '2020-01-01T00:00:00.000Z',
      };
    await mockBase44(page, { user: null, locations: locs, fieldChecks: {} });
    await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto('/adbusting');
    await page.getByText('Spot 1').first().waitFor({ timeout: 30_000 });
    const claims = page.getByRole('button', { name: 'Claim', exact: true });
    const n = await claims.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const b = (await claims.nth(i).boundingBox())!;
      const topIsClaim = await page.evaluate(
        ([x, y]) => {
          const e = document.elementFromPoint(x, y);
          return (
            !!e && !!e.closest('button') && /claim/i.test(e.closest('button')!.textContent || '')
          );
        },
        [b.x + b.width / 2, b.y + b.height / 2],
      );
      expect(topIsClaim, `Claim #${i} must not be covered`).toBe(true);
      expect(b.height, 'Claim target height').toBeGreaterThanOrEqual(24);
    }
    await claims.first().click({ timeout: 5_000 });
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}
