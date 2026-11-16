import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// UI-031 + UI-041. Window I (c869cc4 on BACKUP, anonymous and MEMBER, 844x390 SPLIT) measured: the map box is
// ~100px tall; the open AIR panel (230x265) ran past the box and sat under the zoom row; the "OOH · ORBITAL
// TELEMETRY" block overlapped the "drag · scroll to zoom" hint. Fix is scoped to opt-in compact portals in short
// landscape: decorative telemetry is dropped, AIR starts as a labelled disclosure and opens as a bounded,
// scrollable panel beside the zoom row. Mock backend and mocked air-quality API only; nothing is written.
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

type R = { l: number; t: number; r: number; b: number };
const rect = (b: { x: number; y: number; width: number; height: number } | null): R =>
  ({ l: b!.x, t: b!.y, r: b!.x + b!.width, b: b!.y + b!.height }) as R;
const hit = (a: R, b: R) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
const inside = (a: R, box: R) =>
  a.l >= box.l - 0.5 && a.r <= box.r + 0.5 && a.t >= box.t - 0.5 && a.b <= box.b + 0.5;

const users = [
  ['anonymous', null],
  ['MEMBER', { id: 'm1', role: 'user', access: 'member' }],
] as const;

async function open(page, user: unknown) {
  await page.route('**/api/**', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
  await page.route('https://air-quality-api.open-meteo.com/**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ current: { pm2_5: 12 } }),
    }),
  );
  await mockBase44(page, { user, locations: locs, fieldChecks: {} });
  await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/adbusting');
  await expect(page.getByText(/\d+ results/).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('INITIALIZING GLOBE')).toHaveCount(0, { timeout: 60_000 });
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible({ timeout: 30_000 });
  // let the HUD's station fetches settle so the panel (if shown) has its real height
  await page.waitForTimeout(1500);
}
const zoomRects = async (page) => {
  const out: R[] = [];
  for (const n of ['Zoom in', 'Zoom out', 'Reset north', 'Auto-spin'])
    out.push(rect(await page.getByRole('button', { name: n, exact: true }).boundingBox()));
  return out;
};

for (const [label, user] of users) {
  test(`844x390 SPLIT ${label}: no HUD box leaves the map box or covers the zoom row / hint`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await open(page, user);
    const box = rect(await page.locator('[data-hud-compact]').boundingBox());
    const zooms = await zoomRects(page);
    const hint = rect(await page.getByText(/drag · scroll to zoom/i).boundingBox());
    // every HUD element that renders text: AIR panel/button, telemetry block, ...
    const hud = await page.evaluate(() => {
      const root = document.querySelector('[data-hud-compact] [class*="z-[900]"]');
      if (!root) return [];
      return [...root.querySelectorAll('*')]
        .filter((e) => {
          const s = getComputedStyle(e);
          const b = e.getBoundingClientRect();
          return (
            s.display !== 'none' &&
            s.visibility !== 'hidden' &&
            b.width > 0 &&
            b.height > 0 &&
            [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent || '').trim())
          );
        })
        .map((e) => {
          const b = e.getBoundingClientRect();
          return {
            t: (e.textContent || '').trim().slice(0, 24),
            l: b.x,
            tp: b.y,
            r: b.right,
            b: b.bottom,
          };
        });
    });
    for (const h of hud) {
      const r = { l: h.l, t: h.tp, r: h.r, b: h.b };
      expect(inside(r, box), `HUD text "${h.t}" stays inside the map box`).toBe(true);
      for (const z of zooms)
        expect(hit(r, z), `HUD text "${h.t}" must not sit under a zoom button`).toBe(false);
      expect(hit(r, hint), `HUD text "${h.t}" must not overlap the drag/zoom hint`).toBe(false);
    }
  });

  test(`844x390 SPLIT ${label}: AIR is a labelled disclosure; opens bounded, scrolls, Escape returns focus`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await open(page, user);
    const box = rect(await page.locator('[data-hud-compact]').boundingBox());
    const zooms = await zoomRects(page);
    const air = page.getByRole('button', { name: 'Show Air Commons PM2.5' });
    await expect(air).toBeVisible();
    await expect(air).toHaveAttribute('aria-expanded', 'false');
    const ar = rect(await air.boundingBox());
    expect(inside(ar, box)).toBe(true);
    expect(ar.b - ar.t).toBeGreaterThanOrEqual(31.5);
    for (const z of zooms) expect(hit(ar, z)).toBe(false);
    await expect(page.getByText('ORBITAL TELEMETRY')).toBeHidden();
    // keyboard open
    await air.focus();
    await page.keyboard.press('Enter');
    const panel = page.locator('[data-tour="hud-pm25"]');
    await expect(panel).toBeVisible();
    const pr = rect(await panel.boundingBox());
    expect(inside(pr, box), 'open AIR panel stays inside the map box').toBe(true);
    for (const z of zooms)
      expect(hit(pr, z), 'open AIR panel does not cover the zoom row').toBe(false);
    const list = page.getByRole('region', { name: 'Air commons stations' });
    await expect(list).toBeVisible();
    const scroll = await list.evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }));
    // all stations stay reachable: a bounded list scrolls instead of being clipped
    expect(scroll.sh).toBeGreaterThan(scroll.ch);
    await list.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(list.getByText('Bogotá')).toBeVisible();
    // other controls still take pointer input while the panel is open
    for (const n of ['Zoom in', 'Zoom out', 'Reset north', 'Auto-spin']) {
      const b = page.getByRole('button', { name: n, exact: true });
      const r = rect(await b.boundingBox());
      const top = await page.evaluate(
        ([x, y, name]) => {
          const e = document.elementFromPoint(x as number, y as number);
          return (
            !!e &&
            (e.getAttribute('aria-label') === name || !!e.closest(`button[aria-label="${name}"]`))
          );
        },
        [(r.l + r.r) / 2, (r.t + r.b) / 2, n] as const,
      );
      expect(top, `${n} is topmost with AIR open`).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(air).toBeFocused();
  });
}

test('844x390 SPLIT: Flat <-> Globe mid-zoom keeps zoom row reachable and attribution unobstructed', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await open(page, null);
  const flat = page.getByRole('button', { name: 'Flat map' });
  const globe = page.getByRole('button', { name: 'Globe', exact: true });
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await flat.click();
  await expect(flat).toHaveAttribute('aria-pressed', 'true');
  const box = rect(await page.locator('[data-hud-compact]').boundingBox());
  const zi = page.getByRole('button', { name: 'Zoom in', exact: true });
  await expect(zi).toBeVisible();
  const z = rect(await zi.boundingBox());
  expect(inside(z, box)).toBe(true);
  const attr = page.locator('.leaflet-control-attribution');
  if (await attr.isVisible()) {
    const a = rect(await attr.boundingBox());
    expect(hit(a, z), 'attribution must not sit under the flat zoom control').toBe(false);
  }
  await globe.click();
  await expect(globe).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toBeVisible();
});
