import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// PortalOps.jsx's "Ops Console" tab fires real base44.functions.invoke()
// calls and used to render ANY resolved call as a flat green "ok", even
// when the function's own response body says otherwise (n8nPing returns
// HTTP 200 with {ok:false, reason:...} by design when N8N_WEBHOOK_URL isn't
// configured). Also, the console's own cachedIntel call sent an empty body
// against a function that requires {key:'skyIntel'}, always producing a
// 400 that was the console's bug, not the function's.

test.describe('PortalOps — Ops Console outcome classification', () => {
  test('n8nPing ok:false renders MISCONFIGURED, cachedIntel sends the right key and renders HEALTHY, opsHealth stays a stub', async ({
    page,
  }) => {
    test.setTimeout(30_000);

    const db: MockDb = {
      user: { id: 'admin-1', role: 'admin', email: 'admin@example.com' },
    };
    await mockBase44(page, db);

    let cachedIntelBody: unknown = null;
    await page.route('**/functions/n8nPing', (route) =>
      route.fulfill({
        status: 200,
        json: { ok: false, reason: 'N8N_WEBHOOK_URL not set', hint: 'Add the webhook URL.' },
      }),
    );
    await page.route('**/functions/cachedIntel', (route) => {
      cachedIntelBody = route.request().postDataJSON();
      return route.fulfill({ status: 200, json: { events: [] } });
    });
    await page.route('**/functions/fieldStats', (route) =>
      route.fulfill({ status: 200, json: { reports: 12, verified: 8, operatives: 5 } }),
    );

    await page.goto('/portal/ops?access_token=mock-admin-token');
    await page.getByRole('button', { name: 'Ops Console' }).click();

    await page.getByRole('button', { name: 'Run n8nPing' }).click();
    await expect(page.getByText(/MISCONFIGURED/)).toBeVisible();

    await page.getByRole('button', { name: 'Run cachedIntel' }).click();
    await expect(page.getByText(/HEALTHY/).first()).toBeVisible();
    expect(cachedIntelBody).toEqual({ key: 'skyIntel' });

    await page.getByRole('button', { name: 'Run fieldStats' }).click();
    await expect(page.getByText(/HEALTHY/).nth(1)).toBeVisible();

    // opsHealth is a proposed stub -- clicking it must never fire a real
    // request, and the button's own label already says so.
    let opsHealthCalled = false;
    await page.route('**/functions/opsHealth', (route) => {
      opsHealthCalled = true;
      return route.fulfill({ status: 404, json: {} });
    });
    await page.getByRole('button', { name: /opsHealth \(proposed\)/ }).click();
    await expect(page.getByText(/proposed function — not called/)).toBeVisible();
    expect(opsHealthCalled).toBe(false);
  });
});
