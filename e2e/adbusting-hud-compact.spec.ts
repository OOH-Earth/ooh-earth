import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// /adbusting globe: the decorative telemetry HUD (title, UTC, signal, moon) was painted over the
// globe imagery on phones (it is already hidden on /map via data-map-room). Phones must not show it;
// desktop keeps it. Mock backend only; nothing is submitted.
const CASES = [
  { n: 'phone', w: 390, h: 844, hud: false },
  { n: 'reflow', w: 320, h: 640, hud: false },
  { n: 'desktop', w: 1280, h: 800, hud: true },
];
for (const c of CASES) {
  test(`adbusting globe HUD is compact on phones @${c.n} ${c.w}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.route('**/api/**', (r) =>
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
    );
    const locs: Record<string, unknown> = {};
    for (let i = 0; i < 6; i++)
      locs['l' + i] = {
        id: 'l' + i,
        title: `Spot ${i}`,
        type: 'billboard',
        address: `${i} Field Way`,
        lat: 13.75 + i * 0.001,
        lng: 100.5 + i * 0.001,
        status: 'pending',
        created_date: '2020-01-01T00:00:00.000Z',
      };
    await mockBase44(page, { user: null, locations: locs, fieldChecks: {} });
    await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
    await page.setViewportSize({ width: c.w, height: c.h });
    await page.goto('/adbusting');
    await expect(page.getByText(/\d+ results/).first()).toBeVisible({ timeout: 30_000 });
    const hud = page.getByText('OOH · ORBITAL TELEMETRY');
    // Ready signal first: the globe finished initialising and the HUD is mounted in the DOM. Then
    // "hidden" can only mean CSS hid it, not that it never rendered.
    await expect(page.getByText('INITIALIZING GLOBE')).toHaveCount(0, { timeout: 60_000 });
    await expect(hud).toHaveCount(1, { timeout: 30_000 });
    if (c.hud) {
      await expect(hud).toBeVisible();
      await expect(page.getByText(/^UTC /).first()).toBeVisible();
    } else {
      await expect(hud).toBeHidden();
      await expect(page.getByText(/^UTC /).first()).toBeHidden();
      await expect(page.getByText(/DATALINK OPEN/)).toBeHidden();
      // required controls and information stay available on phones
      await expect(page.locator('button:has(svg.lucide-globe)').first()).toBeVisible();
      await expect(page.getByText(/\d+ results/).first()).toBeVisible();
    }
  });
}

// Scope guard: the setting is opt-in. Other PortalShell consumers (here /graffiti) keep the HUD on phones.
test('graffiti portal HUD is unchanged on phones (opt-in scope)', async ({ page }) => {
  test.setTimeout(90_000);
  await page.route('**/api/**', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
  await mockBase44(page, { user: null, locations: {}, fieldChecks: {} });
  await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/graffiti');
  await expect(page.getByText('OOH · ORBITAL TELEMETRY')).toBeVisible({ timeout: 30_000 });
});

// Regression guard from independent review: compactHud must not hide the AIR panel on tablet widths.
test('adbusting keeps the AIR panel at 1024x768 (compactHud is phone-only)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.route('**/api/**', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
  await mockBase44(page, { user: null, locations: {}, fieldChecks: {} });
  await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/adbusting');
  await expect(page.getByText('OOH · ORBITAL TELEMETRY')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/AIR COMMONS/).first()).toBeVisible({ timeout: 30_000 });
});
