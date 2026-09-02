import { test, expect, type Page } from '@playwright/test';
import { mockBase44, ADMIN_USER, type MockDb } from './fixtures/mockBase44';

// Closes the one verified gap in the field-evidence flywheel (discovery
// mission finding): PortalOps' Verification Priority Queue already knows
// exactly which locations need checking and why (src/lib/geospatialIntelligence.js
// buildVerificationQueue), but until now a queue row was plain text -- no
// click-through into the FieldCheck workflow that already exists for that
// exact location. This suite proves the new "Verify in field" action wires
// the two together with a pure navigation hint (`?action=recheck`), and that
// every safety property the mission required actually holds: no auto-mutation,
// no auto-opened camera, invalid query values fail harmlessly, and the new
// analytics events carry no PII/coordinates/notes/tokens.

async function captureAnalyticsEvents(page: Page) {
  const events: { event_name: string; properties?: Record<string, unknown> }[] = [];
  await page.route('**/analytics/track/batch', async (route) => {
    const body = route.request().postDataJSON() ?? {};
    events.push(...(body.events || []));
    await route.fulfill({ json: { ok: true } });
  });
  return events;
}

function waitForEvent(
  events: { event_name: string; properties?: Record<string, unknown> }[],
  eventName: string,
) {
  return expect
    .poll(() => events.some((e) => e.event_name === eventName), { timeout: 10_000 })
    .toBe(true);
}

test.describe('Verification Priority Queue → field-check deep link', () => {
  test('a queue row links to the correct Location, records selection, and preserves browser history', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const old = '2020-01-01T00:00:00.000Z';
    const db: MockDb = {
      user: ADMIN_USER,
      locations: {
        'loc-stale-p1': {
          id: 'loc-stale-p1',
          lat: 1,
          lng: 2,
          status: 'verified',
          status_updated_at: old,
          created_date: old,
        },
      },
      fieldChecks: {},
    };
    await mockBase44(page, db);
    const events = await captureAnalyticsEvents(page);

    await page.goto('/portal/ops?access_token=mock-admin-token');
    await page.getByRole('button', { name: 'Geospatial Intelligence' }).click();

    const queueRow = page.locator('table tbody tr').first();
    await expect(queueRow).toContainText('P1');

    // Top of the field-action funnel: fires once the queue actually renders
    // a real, non-empty recommendation -- not merely because the tab exists.
    await waitForEvent(events, 'verification_queue_viewed');
    const viewed = events.filter((e) => e.event_name === 'verification_queue_viewed');
    expect(viewed).toHaveLength(1);
    expect(viewed[0].properties).toMatchObject({ count: 1, top_priority: 'P1' });

    const action = queueRow.getByRole('link', { name: /Verify in field/i });
    await expect(action).toHaveAttribute('href', '/location/loc-stale-p1?action=recheck');

    await action.click();
    await expect(page).toHaveURL(/\/location\/loc-stale-p1\?action=recheck/);

    // Field action selected: carries only the deterministic, already-public
    // classification labels shown in the row (priority/quality) -- never the
    // Location id, coordinates, or any content-bearing field.
    await waitForEvent(events, 'recheck_action_selected');
    const selected = events.filter((e) => e.event_name === 'recheck_action_selected');
    expect(selected).toHaveLength(1);
    expect(selected[0].properties).toMatchObject({ priority: 'P1' });
    expect(Object.keys(selected[0].properties ?? {}).sort()).toEqual(['priority', 'quality']);

    // Browser back navigation remains sane: returns to a working /portal/ops
    // page, not a broken or blank history entry. (Which tab is selected on
    // return is pre-existing PortalOps behavior -- its section selector is
    // local component state, not part of the URL -- and out of scope here.)
    await page.goBack();
    await expect(page).toHaveURL(/\/portal\/ops/);
    await expect(
      page.getByRole('heading', { name: /Architecture Operations Portal/i }),
    ).toBeVisible();
  });

  test('the deep link reaches FieldCheck context without opening the camera or mutating anything', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const db: MockDb = {
      user: null,
      locations: {
        'loc-instr': {
          id: 'loc-instr',
          title: 'Billboard · Instrumentation Check',
          type: 'billboard',
          lat: 13.7,
          lng: 100.5,
          status: 'verified',
          status_updated_at: '2020-01-01T00:00:00.000Z',
          image_url: 'https://example.com/original.jpg',
        },
      },
      fieldChecks: {},
    };
    await mockBase44(page, db);
    const events = await captureAnalyticsEvents(page);

    // Direct URL navigation (not a click-through) -- proves the deep link
    // works on its own, independent of how the visitor arrived.
    await page.goto('/location/loc-instr?action=recheck');

    await expect(page.getByText(/Flagged for field verification/i)).toBeVisible();
    await expect(page.getByText(/no field evidence on record yet/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Re-check this spot/i })).toBeVisible();

    // No automatic mutation, no automatic camera/permission prompt: the
    // capture UI only renders once the operator explicitly clicks the
    // (unchanged, existing) "Re-check this spot" button.
    await expect(page.getByRole('button', { name: /Log field check/i })).toHaveCount(0);
    await expect(page.getByLabel('Or choose from gallery')).toHaveCount(0);
    expect(Object.keys(db.fieldChecks ?? {})).toHaveLength(0);
    expect(db.locations?.['loc-instr'].status_updated_at).toBe('2020-01-01T00:00:00.000Z');

    // Reaching field-check context is tracked distinctly from merely seeing
    // the CTA (recheck_cta_viewed) or opening the camera (camera_opened) --
    // and carries no coordinates, photos, notes, or tokens.
    await waitForEvent(events, 'recheck_context_reached');
    const reached = events.filter((e) => e.event_name === 'recheck_context_reached');
    expect(reached).toHaveLength(1);
    expect(reached[0].properties).toMatchObject({ check_type: 'billboard', has_evidence: false });
    expect(Object.keys(reached[0].properties ?? {}).sort()).toEqual(['check_type', 'has_evidence']);

    // The explicit, user-initiated path still works exactly as before.
    await page.getByRole('button', { name: /Re-check this spot/i }).click();
    await expect(page.getByRole('button', { name: /Log field check/i })).toBeVisible();
  });

  test('a missing or invalid action query value fails harmlessly -- normal LocationDetail behavior, unchanged', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const db: MockDb = {
      user: null,
      locations: {
        'loc-instr': {
          id: 'loc-instr',
          title: 'Billboard · Instrumentation Check',
          type: 'billboard',
          lat: 13.7,
          lng: 100.5,
          status: 'verified',
          status_updated_at: '2020-01-01T00:00:00.000Z',
        },
      },
      fieldChecks: {},
    };
    await mockBase44(page, db);
    const events = await captureAnalyticsEvents(page);

    // No query param at all: today's ordinary navigation path.
    await page.goto('/location/loc-instr');
    await expect(page.getByRole('button', { name: /Re-check this spot/i })).toBeVisible();
    await expect(page.getByText(/Flagged for field verification/i)).toHaveCount(0);

    // An unrecognized action value: must be ignored, not acted on.
    await page.goto('/location/loc-instr?action=delete');
    await expect(page.getByRole('button', { name: /Re-check this spot/i })).toBeVisible();
    await expect(page.getByText(/Flagged for field verification/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Log field check/i })).toHaveCount(0);

    expect(events.some((e) => e.event_name === 'recheck_context_reached')).toBe(false);
    expect(Object.keys(db.fieldChecks ?? {})).toHaveLength(0);
    expect(db.locations?.['loc-instr'].status).toBe('verified');
  });
});
