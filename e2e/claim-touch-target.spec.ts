import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// The list-card Claim button was 58x18 CSS px. WCAG 2.5.8 (AA) needs >= 24px or a spacing exception.
// Fix: 24px visible box + a ::before hit area that reaches up into the card padding, 2px down, 4px left, 8px
// right. It must never cover the title row below, the PAGE link, or the freshness tags to the left.
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
    created_date: '2020-01-01T00:00:00.000Z',
  };

for (const [w, h] of [
  [390, 844],
  [320, 640],
] as const) {
  test(`Claim: >=24px box, bigger hit area, no stolen taps from title/link/neighbours @${w}`, async ({
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
      const link = card.querySelector('a')!;
      const lb = link.getBoundingClientRect();
      const lt = document.elementFromPoint(lb.x + lb.width / 2, lb.y + lb.height / 2);
      const title = [...card.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && (e.textContent || '').startsWith(longTitle.slice(0, 20)),
      )!;
      const tb = title.getBoundingClientRect();
      const cx = b.x + b.width / 2;
      return {
        h: b.height,
        // inside the extended hit area: 10px above, 0.5px below, 3px left, 2px right
        grown: [
          own(cx, b.y - 10),
          own(cx, b.y + b.height + 0.5),
          own(b.x - 3, b.y + b.height / 2),
          own(b.x + b.width + 2, b.y + b.height / 2),
        ],
        linkOwned: link === lt || link.contains(lt),
        // title text under the middle of the button must still belong to the card, not to Claim
        titleUnderClaim: tb.x < b.x + b.width / 2 && tb.x + tb.width > b.x + b.width / 2,
        titleStolen: own(b.x + b.width / 2, tb.y + 3),
        // the control must not grow into the PAGE column
        pageGap: lb.x - (b.x + b.width),
      };
    }, LONG);
    expect.soft(r.h).toBeGreaterThanOrEqual(23.5);
    expect.soft(r.grown, 'extended hit area').toEqual([true, true, true, true]);
    expect.soft(r.linkOwned).toBe(true);
    expect.soft(r.titleUnderClaim, 'test precondition: the long title runs under Claim').toBe(true);
    expect.soft(r.titleStolen).toBe(false);
    expect.soft(r.pageGap).toBeGreaterThan(3);
    await claim.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
}
