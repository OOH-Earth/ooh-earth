import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// UI-036: the Flat / Globe view buttons had no accessible name below 640px (label text is sm:inline) and no
// state. Mock backend only; nothing is submitted.
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
for (const [w, h] of [
  [1280, 800],
  [390, 844],
  [320, 640],
] as const) {
  test(`view and layout toggles are named, stateful, pointer and keyboard operable @${w}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.route('**/api/**', (r) =>
      r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
    );
    await mockBase44(page, { user: null, locations: locs, fieldChecks: {} });
    await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/adbusting');
    await expect(page.getByText(/\d+ results/).first()).toBeVisible({ timeout: 30_000 });
    const view = page.getByRole('group', { name: 'Map view' });
    const flat = view.getByRole('button', { name: 'Flat map' });
    const globe = view.getByRole('button', { name: 'Globe' });
    await expect(flat).toBeVisible();
    await expect(globe).toBeVisible();
    // pointer
    await globe.click();
    await expect(globe).toHaveAttribute('aria-pressed', 'true');
    await expect(flat).toHaveAttribute('aria-pressed', 'false');
    await flat.click();
    await expect(flat).toHaveAttribute('aria-pressed', 'true');
    await expect(globe).toHaveAttribute('aria-pressed', 'false');
    // keyboard: Enter and Space on a focused toggle
    await globe.focus();
    await page.keyboard.press('Enter');
    await expect(globe).toHaveAttribute('aria-pressed', 'true');
    await flat.focus();
    await page.keyboard.press('Space');
    await expect(flat).toHaveAttribute('aria-pressed', 'true');
    // Tab order reaches the next toggle from the first
    await flat.focus();
    await page.keyboard.press('Tab');
    await expect(globe).toBeFocused();
    // layout toggle exposes pressed state too
    const layout = page.getByRole('group', { name: 'Results layout' });
    await layout.getByRole('button', { name: 'List', exact: true }).click();
    await expect(layout.getByRole('button', { name: 'List', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(layout.getByRole('button', { name: 'Map', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
}
