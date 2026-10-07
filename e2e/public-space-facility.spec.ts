import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb, ADMIN_USER } from './fixtures/mockBase44';

// Public Space / Street Sports Intelligence v1 — LocationDetail coverage.
// Mission tests 1, 2, 3, 4, 5: skatepark + basketball court representable,
// unknown values safely fall back, a visible logo alone never becomes a
// sponsorship claim, and a verified relationship requires evidence + a
// moderator verification (never a self-set status — see
// LocationRelationship.jsonc's status RLS).

test('a skatepark location renders its facility metadata on the detail page', async ({ page }) => {
  const db: MockDb = {
    user: null,
    locations: {
      'sk-1': {
        id: 'sk-1',
        title: 'Riverside Skatepark',
        type: 'skatepark',
        setting: 'outdoor',
        public_access: 'free',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
  };
  await mockBase44(page, db);
  await page.goto('/location/sk-1');
  const panel = page.getByTestId('public-space-panel');
  await expect(panel).toBeVisible({ timeout: 10_000 });
  await expect(panel.getByText('Skatepark', { exact: true })).toBeVisible();
  await expect(panel.getByText('Outdoor', { exact: false })).toBeVisible();
  await expect(panel.getByText('Public access: Free', { exact: false })).toBeVisible();
});

test('a basketball court location renders its facility metadata on the detail page', async ({
  page,
}) => {
  const db: MockDb = {
    user: null,
    locations: {
      'bb-1': {
        id: 'bb-1',
        title: 'Sukhumvit Courts',
        type: 'basketball_court',
        setting: 'covered',
        public_access: 'low_cost',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
  };
  await mockBase44(page, db);
  await page.goto('/location/bb-1');
  const panel = page.getByTestId('public-space-panel');
  await expect(panel).toBeVisible({ timeout: 10_000 });
  await expect(panel.getByText('Basketball Court', { exact: true })).toBeVisible();
  await expect(panel.getByText('Covered', { exact: false })).toBeVisible();
  await expect(panel.getByText('Public access: Low cost', { exact: false })).toBeVisible();
});

test('unset setting/public_access on a facility location safely fall back to Unknown, never inferred', async ({
  page,
}) => {
  const db: MockDb = {
    user: null,
    locations: {
      'mu-1': {
        id: 'mu-1',
        title: 'Unnamed multi-use court',
        type: 'multi_use_court',
        // setting/public_access deliberately omitted -- must not be
        // inferred as "outdoor"/"free" just because it looks public.
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
  };
  await mockBase44(page, db);
  await page.goto('/location/mu-1');
  const panel = page.getByTestId('public-space-panel');
  await expect(panel).toBeVisible({ timeout: 10_000 });
  await expect(panel.getByText('Multi-Use Court', { exact: true })).toBeVisible();
  await expect(panel.getByText('Unknown · Public access: Unknown')).toBeVisible();
});

test('a visible brand logo alone shows as an observation, never as an automatic sponsorship claim', async ({
  page,
}) => {
  const db: MockDb = {
    user: null,
    locations: {
      'sk-2': {
        id: 'sk-2',
        title: 'City Skatepark',
        type: 'skatepark',
        brand_name: 'Global Bank Co',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
    // Deliberately no locationRelationships records -- a bare logo on the
    // Location record must never auto-create a relationship claim.
    locationRelationships: {},
  };
  await mockBase44(page, db);
  await page.goto('/location/sk-2');
  await expect(page.getByText('Visible Branding')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Global Bank Co')).toBeVisible();
  await expect(
    page.getByText('Evidence: logo visible in submitted photo — not a claimed relationship'),
  ).toBeVisible();
  await expect(page.getByText('No relationship claims on record')).toBeVisible();
  // The word "Sponsor" must not appear anywhere as an asserted fact for
  // this location -- only inside the propose-a-relationship form's own
  // <select> options, never as rendered claim text.
  await expect(page.getByText(/Global Bank Co.*Sponsor/)).toHaveCount(0);
});

test('a pending relationship claim reads as UNKNOWN; only a moderator-verified one with evidence reads as a fact', async ({
  page,
}) => {
  const db: MockDb = {
    user: null,
    locations: {
      'sk-3': {
        id: 'sk-3',
        title: 'Harborside Skatepark',
        type: 'skatepark',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
    locationRelationships: {
      pending1: {
        id: 'pending1',
        location_id: 'sk-3',
        brand_name: 'Nike',
        relationship_type: 'sponsor',
        status: 'pending',
        created_date: new Date().toISOString(),
      },
      verified1: {
        id: 'verified1',
        location_id: 'sk-3',
        brand_name: 'Community Trust Fund',
        relationship_type: 'community_partner',
        evidence_source: 'Plaque at entrance: "Rebuilt with Community Trust Fund, 2024"',
        verified_date: '2024-06-01T00:00:00.000Z',
        status: 'verified',
        created_date: '2024-01-01T00:00:00.000Z',
      },
    },
  };
  await mockBase44(page, db);
  await page.goto('/location/sk-3');

  // Pending claim: brand name shown, but the relationship itself reads as
  // UNKNOWN, and is visibly flagged Unverified -- never rendered as "Sponsor".
  const pendingRow = page.getByText('Nike').locator('..').locator('..');
  await expect(pendingRow.getByText('UNKNOWN')).toBeVisible({ timeout: 10_000 });
  await expect(pendingRow.getByText('Unverified', { exact: true })).toBeVisible();
  await expect(pendingRow.getByText('Sponsor', { exact: true })).toHaveCount(0);

  // Verified claim: relationship type, evidence source, and verified date
  // all render as the mission's example format.
  const verifiedRow = page.getByText('Community Trust Fund').locator('..').locator('..');
  await expect(verifiedRow.getByText('Community Partner')).toBeVisible();
  await expect(verifiedRow.getByText(/Source: Plaque at entrance/)).toBeVisible();
  await expect(verifiedRow.getByText(/Verified:/)).toBeVisible();
  await expect(verifiedRow.getByText('Verified', { exact: true })).toBeVisible();
});

test('proposing a relationship claim never sets status directly and starts unverified', async ({
  page,
}) => {
  const db: MockDb = {
    user: { ...ADMIN_USER, id: 'reporter-1', role: 'user', access: 'member' },
    locations: {
      'sk-4': {
        id: 'sk-4',
        title: 'Testville Skatepark',
        type: 'skatepark',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
    locationRelationships: {},
  };
  await mockBase44(page, db);
  await page.goto('/location/sk-4');
  await page.getByRole('button', { name: 'Propose a relationship' }).click();
  await page.getByPlaceholder('Brand / organization name').fill('Acme Skate Co');
  await page
    .getByPlaceholder('Evidence: plaque text, naming-rights signage, announcement URL, etc.')
    .fill('Logo visible on quarter-pipe, no signage confirming a relationship');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(
    page.getByText(
      'Claim submitted — stays UNKNOWN/pending until a moderator reviews the evidence.',
    ),
  ).toBeVisible();
});

// Existing OOH ad-surface locations (mission test 10) must render exactly as
// before -- AdvertiserInfo still shown, PublicSpacePanel never mounted.
test('an existing billboard location is unaffected: no PublicSpacePanel mounts', async ({
  page,
}) => {
  const db: MockDb = {
    user: null,
    locations: {
      'bill-1': {
        id: 'bill-1',
        title: 'Old Billboard',
        type: 'billboard',
        brand_name: 'Shell',
        lat: 13.7,
        lng: 100.5,
        status: 'verified',
      },
    },
  };
  await mockBase44(page, db);
  await page.goto('/location/bill-1');
  await expect(page.getByText('Shell').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('public-space-panel')).toHaveCount(0);
  await expect(page.getByText('Propose a relationship')).toHaveCount(0);
});
