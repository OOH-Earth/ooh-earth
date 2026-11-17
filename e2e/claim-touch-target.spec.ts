import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// UI-040. The list-card Claim button was 58x18 CSS px, then 58x24 with an invisible ::before that grew the
// tappable area to about 64x34 (measured by pointer hit-testing on BACKUP, Window I). The visible box is now the
// target: >= 44px tall, 10px label (the documented "Label · Mono" step), and NO invisible extension, so no
// unseen region can take a tap meant for the title, the PAGE link or the next row.
// Mock backend only; the claim dialog is opened and dismissed, never submitted.
const LONG = 'Spot with a very long descriptive title that runs underneath the claim button row';
const locs: Record<string, unknown> = {};
for (let i = 0; i < 3; i++)
  locs['l' + i] = {
    id: 'l' + i,
    title: i === 0 ? LONG : `Spot ${i}`,
    type: 'billboard',
    address: 'x',
    lat: 13.75 + i * 0.001,
    lng: 100.5 + i * 0.001,
    status: 'pending',
    // the busted tag makes the meta row (label + dot + tag + Claim) wider than the 320px text column
    adbust_type: 'sticker',
    created_date: '2020-01-01T00:00:00.000Z',
  };

for (const [w, h] of [
  [390, 844],
  [320, 640],
] as const) {
  test(`Claim: 44px visible target, no invisible hit area, clear of title/link/neighbours @${w}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.route('**/api/**', (r) =>
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
    );
    await mockBase44(page, {
      user: { id: 'm1', role: 'user', access: 'member' },
      locations: locs,
      fieldChecks: {},
    });
    await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/adbusting');
    await page
      .locator('div.flex.border', { has: page.getByRole('button', { name: 'Split', exact: true }) })
      .getByRole('button', { name: 'List', exact: true })
      .click();
    const claim = page.getByRole('button', { name: 'Claim', exact: true }).first();
    await expect(claim).toBeVisible({ timeout: 30_000 });
    const r = await claim.evaluate((el, longTitle) => {
      const b = el.getBoundingClientRect();
      const own = (x: number, y: number) => {
        const t = document.elementFromPoint(x, y);
        return t === el || el.contains(t);
      };
      const card = el.closest('[role="button"]')!;
      const cb = card.getBoundingClientRect();
      const link = card.querySelector('a')!;
      const lb = link.getBoundingClientRect();
      const title = [...card.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && (e.textContent || '').startsWith(longTitle.slice(0, 20)),
      )!;
      const tb = title.getBoundingClientRect();
      const cx = b.x + b.width / 2;
      const cy = b.y + b.height / 2;
      // Sample the whole card plus 40px around the box: every point owned by Claim must lie inside its visible rect.
      let outside = 0;
      for (let x = b.x - 40; x <= b.right + 40; x += 2)
        for (let y = b.y - 40; y <= b.bottom + 40; y += 2)
          if (
            own(x, y) &&
            (x < b.x - 0.5 || x > b.right + 0.5 || y < b.y - 0.5 || y > b.bottom + 0.5)
          )
            outside++;
      return {
        h: b.height,
        w: b.width,
        font: getComputedStyle(el).fontSize,
        // the centre and all four edges (1px inside) are hit-testable on the button itself
        edges: [
          own(cx, cy),
          own(b.x + 1, cy),
          own(b.right - 1, cy),
          own(cx, b.y + 1),
          own(cx, b.bottom - 1),
        ],
        outside,
        // 3px beyond each edge is NOT the button (no invisible growth)
        beyond: [own(cx, b.y - 3), own(cx, b.bottom + 3), own(b.x - 3, cy), own(b.right + 3, cy)],
        // visible box must not intersect the title text, the PAGE link, or leave the card
        intersectsTitle: b.x < tb.right && tb.x < b.right && b.y < tb.bottom && tb.y < b.bottom,
        intersectsLink: b.x < lb.right && lb.x < b.right && b.y < lb.bottom && lb.y < b.bottom,
        pageGap: lb.x - b.right,
        insideCard: b.y >= cb.y && b.bottom <= cb.bottom,
      };
    }, LONG);
    expect.soft(r.h, 'rendered target height').toBeGreaterThanOrEqual(43.5);
    expect.soft(r.w).toBeGreaterThanOrEqual(24);
    expect.soft(r.font, 'label uses the 10px mono step').toBe('10px');
    expect.soft(r.edges, 'centre and edges hit the button').toEqual([true, true, true, true, true]);
    expect.soft(r.outside, 'no tappable area outside the visible box').toBe(0);
    expect.soft(r.beyond).toEqual([false, false, false, false]);
    expect.soft(r.intersectsTitle, 'Claim box must not cover the title').toBe(false);
    expect.soft(r.intersectsLink, 'Claim box must not touch the PAGE link').toBe(false);
    expect.soft(r.pageGap).toBeGreaterThanOrEqual(4);
    expect.soft(r.insideCard).toBe(true);
    await claim.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
}
