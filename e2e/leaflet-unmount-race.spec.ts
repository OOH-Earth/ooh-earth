import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// UI-037: toggling Flat <-> Globe while Leaflet is mid zoom-animation threw
// "Cannot read properties of undefined (reading '_leaflet_pos')" after the map was disposed.
// Bounded: 12 round trips. Asserts no page error AND a usable flat map at the end. Mock backend only.
test('rapid Flat/Globe switching: no page error and the flat map stays usable', async ({
  page,
}) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const locs: Record<string, unknown> = {};
  for (let i = 0; i < 6; i++)
    locs['l' + i] = {
      id: 'l' + i,
      title: `Spot ${i}`,
      type: 'billboard',
      address: 'x',
      lat: 13.75 + i * 0.001,
      lng: 100.5 + i * 0.001,
      status: 'pending',
      created_date: '2020-01-01T00:00:00.000Z',
    };
  await page.route('**/api/**', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
  await mockBase44(page, { user: null, locations: locs, fieldChecks: {} });
  await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/adbusting');
  await expect(page.getByText(/\d+ results/).first()).toBeVisible({ timeout: 30_000 });
  // Icon-based locators so this spec stands alone on branches without the UI-036 names.
  const globeBtn = page.locator('button:has(svg.lucide-globe)').first();
  const flatBtn = page.locator('button:has(svg.lucide-map)').first();
  await flatBtn.click(); // the portal opens on the globe
  await expect(page.locator('.leaflet-control-zoom-in')).toBeVisible();
  // Deterministic trigger: start a zoom animation and unmount the flat map inside Leaflet's 250ms
  // transition window, every round trip. Bounded: 12 round trips.
  for (let i = 0; i < 12; i++) {
    await page.locator('.leaflet-control-zoom-in').click();
    await globeBtn.click();
    await flatBtn.click();
  }
  const map = page.locator('.leaflet-container').first();
  await expect(map).toBeVisible();
  const box = (await map.boundingBox())!;
  expect(box.width).toBeGreaterThan(200);
  expect(box.height).toBeGreaterThan(200);
  await expect(page.locator('.leaflet-map-pane.leaflet-zoom-anim')).toHaveCount(0);
  // Usable: zoom still animates and actually changes the zoom level (two markers move apart).
  const spread = async () => {
    const m = page.locator('.leaflet-marker-icon');
    await expect(m.first()).toBeVisible();
    const pts = await m.evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        return [r.x + r.width / 2, r.y + r.height / 2];
      }),
    );
    let max = 0;
    for (const p of pts)
      for (const q of pts) max = Math.max(max, Math.hypot(p[0] - q[0], p[1] - q[1]));
    return max;
  };
  const before = await spread();
  await page.locator('.leaflet-control-zoom-in').click();
  await expect(page.locator('.leaflet-map-pane.leaflet-zoom-anim')).toHaveCount(0);
  await expect.poll(spread).toBeGreaterThan(before * 1.5);
  expect(errors, errors.join(' | ')).toEqual([]);
});
