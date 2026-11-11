import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// UI-032: at 844x390 the globe zoom column (4 x 36px stacked, anchored to the bottom of a ~100px map box)
// extended 110px above the box and covered the right part of the SPLIT / MAP / LIST control, which then lost
// pointer input. Route-scoped (opt-in compact portals only) and short-landscape-only. Mock backend only.
const locs: Record<string, unknown> = {};
for (let i = 0; i < 4; i++)
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

const rect = (b) => b && { l: b.x, t: b.y, r: b.x + b.width, b: b.y + b.height };
const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

async function open(page, w: number, h: number) {
  await page.route('**/api/**', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
  await mockBase44(page, { user: null, locations: locs, fieldChecks: {} });
  await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
  await page.setViewportSize({ width: w, height: h });
  await page.goto('/adbusting');
  await expect(page.getByText(/\d+ results/).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('INITIALIZING GLOBE')).toHaveCount(0, { timeout: 60_000 });
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible({ timeout: 30_000 });
}
const layoutBtn = (page, name: string) =>
  page
    .locator('div.flex.border', { has: page.getByRole('button', { name: 'Split', exact: true }) })
    .getByRole('button', { name, exact: true });
const zoomNames = ['Zoom in', 'Zoom out', 'Reset north', 'Auto-spin'];

test('844x390: zoom column stays inside the map box, off the layout control, and every control takes pointer input', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await open(page, 844, 390);
  const mapBox = rect(await page.locator('[data-hud-compact]').boundingBox())!;
  const zooms = [] as any[];
  for (const n of zoomNames)
    zooms.push(rect(await page.getByRole('button', { name: n, exact: true }).boundingBox()));
  for (const z of zooms) {
    expect(z.l).toBeGreaterThanOrEqual(mapBox.l - 0.5);
    expect(z.r).toBeLessThanOrEqual(mapBox.r + 0.5);
    expect(z.t).toBeGreaterThanOrEqual(mapBox.t - 0.5);
    expect(z.b).toBeLessThanOrEqual(mapBox.b + 0.5);
    expect(z.r - z.l).toBeGreaterThanOrEqual(36);
    expect(z.b - z.t).toBeGreaterThanOrEqual(36);
  }
  for (const n of ['Split', 'Map', 'List']) {
    const lb = layoutBtn(page, n);
    const r = rect(await lb.boundingBox())!;
    for (const z of zooms) expect(hit(r, z), `${n} vs zoom`).toBe(false);
    // actual hit-testing across the full width of the button, not just its centre
    const owners = await lb.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return [0.1, 0.5, 0.9].map((f) => {
        const t = document.elementFromPoint(b.x + b.width * f, b.y + b.height / 2);
        return t === el || el.contains(t);
      });
    });
    expect(owners, `${n} pointer ownership`).toEqual([true, true, true]);
  }
  // the right edge of LIST really works with a pointer
  const list = layoutBtn(page, 'List');
  const lb = (await list.boundingBox())!;
  await page.mouse.click(lb.x + lb.width - 3, lb.y + lb.height / 2);
  await expect(page.locator('[data-hud-compact]')).toBeHidden();
  // zoom controls still respond (no page error)
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await layoutBtn(page, 'Map').click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  expect(errors).toEqual([]);
});

test('844x390 keyboard: Tab order reaches layout buttons and all four zoom controls', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await open(page, 844, 390);
  for (const n of ['Zoom in', 'Zoom out', 'Reset north', 'Auto-spin']) {
    const b = page.getByRole('button', { name: n, exact: true });
    await b.focus();
    await expect(b).toBeFocused();
    const r = (await b.boundingBox())!;
    expect(r.width).toBeGreaterThanOrEqual(36);
  }
});

test('orientation change: row in short landscape, column again in portrait, and back', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await open(page, 844, 390);
  const x = async (n: string) =>
    (await page.getByRole('button', { name: n, exact: true }).boundingBox())!;
  let a = await x('Zoom in');
  let b = await x('Zoom out');
  expect(Math.abs(a.y - b.y)).toBeLessThan(1); // one row
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(async () => Math.abs((await x('Zoom in')).x - (await x('Zoom out')).x))
    .toBeLessThan(1); // one column
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(async () => Math.abs((await x('Zoom in')).y - (await x('Zoom out')).y))
    .toBeLessThan(1);
});

test('desktop keeps the vertical zoom column', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page, 1280, 800);
  const a = (await page.getByRole('button', { name: 'Zoom in', exact: true }).boundingBox())!;
  const b = (await page.getByRole('button', { name: 'Zoom out', exact: true }).boundingBox())!;
  expect(Math.abs(a.x - b.x)).toBeLessThan(1);
  expect(b.y).toBeGreaterThan(a.y);
});

// UI-039: in the flat view the Leaflet "+" sat under the Capture/Report buttons at 844x390 (elementFromPoint
// returned the Report link), so it could not be clicked.
test('844x390 flat view: Leaflet zoom controls are not covered and respond to a pointer', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await open(page, 844, 390);
  await page.locator('button:has(svg.lucide-map)').first().click();
  await expect(page.locator('.leaflet-control-zoom-in')).toBeVisible({ timeout: 30_000 });
  for (const sel of ['.leaflet-control-zoom-in', '.leaflet-control-zoom-out']) {
    const owner = await page.evaluate((s) => {
      const e = document.querySelector(s)!;
      const b = e.getBoundingClientRect();
      const t = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return t === e || e.contains(t);
    }, sel);
    expect(owner, sel).toBe(true);
  }
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.locator('.leaflet-control-zoom-in').click();
  await page.locator('.leaflet-control-zoom-out').click();
  expect(errors).toEqual([]);
});
