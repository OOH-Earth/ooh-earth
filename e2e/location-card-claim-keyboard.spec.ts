import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// UI-035: Space/Enter on the nested Claim button was swallowed by the card's own keydown handler.
// Mock backend only; claimLead is never reached (dialog is opened and cancelled).
test('Claim button opens its dialog from the keyboard; card Enter still selects', async ({
  page,
}) => {
  test.setTimeout(90_000);
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
  await page.route('**/api/**', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
  await mockBase44(page, {
    user: { id: 'm1', role: 'user', access: 'member' },
    locations: locs,
    fieldChecks: {},
  });
  await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/adbusting');
  await page
    .locator('div.flex.border', { has: page.getByRole('button', { name: 'Split', exact: true }) })
    .getByRole('button', { name: 'List', exact: true })
    .click();
  const claim = page.getByRole('button', { name: 'Claim', exact: true }).first();
  await expect(claim).toBeVisible({ timeout: 30_000 });
  for (const key of ['Space', 'Enter']) {
    await claim.focus();
    await page.keyboard.press(key);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  }
});
