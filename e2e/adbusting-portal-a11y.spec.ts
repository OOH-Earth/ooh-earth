import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// /adbusting (PortalShell): controls must have names and reachable state at every width.
// Measured baseline on the production source: the search field was unnamed and display:none below 640px
// (no search at all on phones), the reset and the phone Capture/Report controls were icon-only with no
// accessible name, and the filter chips exposed no pressed state. Mock backend only; nothing is submitted.
const VPS = [
  { n: 'desktop', w: 1280, h: 800 },
  { n: 'phone', w: 390, h: 844 },
  { n: 'reflow', w: 320, h: 640 },
];
for (const vp of VPS) {
  test(`adbusting portal controls are named, reachable and stateful @${vp.n} ${vp.w}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.route('**/api/**', (r) =>
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
    );
    const locs: Record<string, unknown> = {};
    for (let i = 0; i < 12; i++)
      locs['l' + i] = {
        id: 'l' + i,
        title: `Spot ${i}`,
        type: ['billboard', 'digital', 'transit', 'mural'][i % 4],
        address: `${i} Field Way`,
        lat: 13.75 + i * 0.001,
        lng: 100.5 + i * 0.001,
        status: 'pending',
        created_date: '2020-01-01T00:00:00.000Z',
      };
    await mockBase44(page, { user: null, locations: locs, fieldChecks: {} });
    await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto('/adbusting');
    await expect(page.getByText(/\d+ results/).first()).toBeVisible({ timeout: 30_000 });

    // search: present, named, inside the viewport, and it filters
    const search = page.getByRole('textbox', { name: 'Search locations' });
    await expect(search).toBeVisible();
    const sb = (await search.boundingBox())!;
    expect(sb.x).toBeGreaterThanOrEqual(0);
    expect(sb.x + sb.width).toBeLessThanOrEqual(vp.w);
    await search.fill('Spot 7');
    await expect(page.getByText('1 results').first()).toBeVisible();
    await page.getByRole('button', { name: 'Reset search and filters' }).click();
    await expect(search).toHaveValue('');

    // filter chips expose their pressed state and it follows the click
    const chip = page.getByRole('button', { name: /^Billboard/ }).first();
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /^All/ }).first()).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    // Capture / Report have names at every width (icon-only on phones) and a >= 40px target
    for (const [role, name] of [
      ['button', 'Capture photo'],
      ['link', 'Report a location'],
    ] as const) {
      const c = page.getByRole(role, { name });
      await expect(c).toBeVisible();
      const b = (await c.boundingBox())!;
      expect(b.width, `${name} width`).toBeGreaterThanOrEqual(40);
      expect(b.height, `${name} height`).toBeGreaterThanOrEqual(40);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  });
}
