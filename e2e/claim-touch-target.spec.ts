import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// The list-card Claim button was 58x18 CSS px. WCAG 2.5.8 (AA) needs >= 24px or a spacing exception; the
// product target is a comfortable ~44px hit area. Mock backend only; the claim dialog is never submitted.
const locs: Record<string, unknown> = {};
for (let i = 0; i < 3; i++)
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

for (const [w, h] of [
  [390, 844],
  [320, 640],
] as const) {
  test(`Claim has a >=24px visible box and a ~44px hit area that does not steal neighbours @${w}`, async ({
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
    const r = await claim.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const cx = b.x + b.width / 2,
        cy = b.y + b.height / 2;
      const owner = (x: number, y: number) => {
        const t = document.elementFromPoint(x, y);
        return t === el || el.contains(t);
      };
      // 44x44 area centred on the button, inset 2px so we probe inside it
      const pts = [
        [-20, -20],
        [20, -20],
        [-20, 20],
        [20, 20],
        [0, -20],
        [0, 20],
      ].map(([dx, dy]) => owner(cx + dx, cy + dy));
      // the card's PAGE link and the card body must keep their own pointer input
      const card = el.closest('[role="button"]')!;
      const link = card.querySelector('a')!;
      const lb = link.getBoundingClientRect();
      const lt = document.elementFromPoint(lb.x + lb.width / 2, lb.y + lb.height / 2);
      const title = [...card.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && /^Spot \d$/.test(e.textContent || ''),
      )!;
      const tb = title.getBoundingClientRect();
      const tt = document.elementFromPoint(tb.x + 4, tb.y + tb.height / 2);
      return {
        h: b.height,
        w: b.width,
        pts,
        linkOwned: link === lt || link.contains(lt),
        titleStolen: owner(tb.x + 4, tb.y + tb.height / 2),
      };
    });
    expect(r.h).toBeGreaterThanOrEqual(23.5);
    expect(r.pts, 'hit-area probes').toEqual([true, true, true, true, true, true]);
    expect(r.linkOwned).toBe(true);
    expect(r.titleStolen).toBe(false);
    // still opens the dialog (pointer) and backs out
    await claim.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
}
