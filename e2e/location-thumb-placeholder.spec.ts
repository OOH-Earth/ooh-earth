import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// UI-034: the category label used to be painted over "No photo yet" in list thumbnails.
// Asserts the three pieces occupy separate, non-overlapping boxes inside the tile. Mock backend only.
const locs: Record<string, unknown> = {};
for (let i = 0; i < 3; i++)
  locs['l' + i] = {
    id: 'l' + i,
    title: `Spot ${i}`,
    type: i === 2 ? 'public_space' : 'billboard',
    address: 'x',
    lat: 13.75 + i * 0.001,
    lng: 100.5 + i * 0.001,
    status: 'verified',
    created_date: '2020-01-01T00:00:00.000Z',
  };
const box = (l) => l.boundingBox();
const overlap = (a, b) =>
  a &&
  b &&
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;
for (const [w, h, zoom] of [
  [390, 844, 1],
  [320, 640, 1],
  [320, 640, 1.5],
] as const) {
  test(`list thumbnail placeholder parts do not overlap @${w} zoom ${zoom}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.route('**/api/**', (r) =>
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
    );
    await mockBase44(page, { user: null, locations: locs, fieldChecks: {} });
    await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/adbusting');
    await page
      .getByRole('button', { name: 'List', exact: true })
      .last()
      .click()
      .catch(() => {});
    const tiles = page.getByTestId('location-thumb-placeholder');
    await expect(tiles.first()).toBeVisible({ timeout: 30_000 });
    if (zoom !== 1)
      await page.addStyleTag({
        content: `[data-testid="location-thumb-placeholder"]{zoom:${zoom}}`,
      });
    const n = await tiles.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const t = tiles.nth(i);
      const [tb, g, np, lb] = await Promise.all([
        box(t),
        box(t.getByTestId('thumb-glyph')),
        box(t.getByTestId('thumb-nophoto')),
        box(t.getByTestId('thumb-label')),
      ]);
      expect(overlap(g, np), 'glyph/no-photo').toBeFalsy();
      expect(overlap(np, lb), 'no-photo/label').toBeFalsy();
      expect(overlap(g, lb), 'glyph/label').toBeFalsy();
      for (const b of [g, np, lb]) {
        expect(b!.y).toBeGreaterThanOrEqual(tb!.y - 0.5);
        expect(b!.y + b!.height).toBeLessThanOrEqual(tb!.y + tb!.height + 0.5);
      }
      await expect(t.getByTestId('thumb-nophoto')).toHaveText('No photo yet');
      await expect(t.getByTestId('thumb-label')).not.toHaveText('');
    }
  });
}
