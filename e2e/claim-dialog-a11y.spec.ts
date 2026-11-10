import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// UI-038: Claim dialog inputs had visible labels that were not associated with them. claimLead is mocked and
// intercepted; no real claim is ever sent.
async function open(page, claimBody: unknown, calls: { n: number }) {
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
  await page.route('**/functions/claimLead**', (r) => {
    calls.n++;
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(claimBody) });
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
  await claim.focus();
  await page.keyboard.press('Enter');
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  return { claim, dlg };
}

test('claim dialog: labelled inputs, focus inside, Escape returns focus, no request sent', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const calls = { n: 0 };
  const { claim, dlg } = await open(page, { ok: true }, calls);
  await expect(dlg.getByLabel('Member handle')).toBeVisible();
  await expect(dlg.getByLabel(/Recon note/)).toBeVisible();
  await expect(dlg.getByLabel('Member handle')).toHaveAttribute('aria-required', 'true');
  expect(await dlg.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await expect(claim).toBeFocused();
  expect(calls.n).toBe(0);
});

test('claim dialog: a server error is announced and tied to the handle input (mocked)', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const calls = { n: 0 };
  const { dlg } = await open(page, { error: 'Already claimed' }, calls);
  const handle = dlg.getByLabel('Member handle');
  await handle.fill('@tester');
  await dlg.getByRole('button', { name: 'Claim lead' }).click();
  const alert = dlg.getByRole('alert');
  await expect(alert).toHaveText('Already claimed');
  await expect(handle).toHaveAttribute('aria-invalid', 'true');
  const id = await alert.getAttribute('id');
  expect(id).toBeTruthy();
  await expect(handle).toHaveAttribute('aria-describedby', id!);
  expect(calls.n).toBe(1);
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
});
