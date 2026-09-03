import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// LocationDetail (src/pages/LocationDetail.jsx) plus the components it wires
// in: PhotoGallery, TimeSinceTag. Network is mocked at the @base44/sdk REST
// boundary (see fixtures/mockBase44.ts) — this sandbox has no live Base44
// backend, so these tests exercise real component logic against fixture
// data instead of a live one.

function svg(color: string, label = '') {
  const body = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='${color}'/><text x='50%' y='50%' font-size='28' fill='white' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(body)}`;
}

function trackApiFailures(page: import('@playwright/test').Page) {
  const failures: string[] = [];
  page.on('response', (res) => {
    // /entities/User/me 401 is the expected shape for an anonymous visitor
    // (no mocked session) — not a real network failure.
    if (res.url().includes('/entities/User/me')) return;
    if (res.url().includes('/api/apps/') && res.status() >= 400) {
      failures.push(`${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });
  return failures;
}

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// Namespaces screenshots by project (chromium/mobile-chromium) so desktop
// and mobile runs don't overwrite each other's output.
async function shot(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  name: string,
  opts: Parameters<import('@playwright/test').Page['screenshot']>[0] = {},
) {
  await page.screenshot({ path: `e2e/screenshots/${testInfo.project.name}/${name}.png`, ...opts });
}

test.describe('LocationDetail — existing single-image flow', () => {
  test('renders single cover image unchanged when no gallery rows exist', async ({
    page,
  }, testInfo) => {
    const apiFailures = trackApiFailures(page);
    const consoleErrors = trackConsoleErrors(page);

    await mockBase44(page, {
      user: null,
      locations: {
        'loc-single-1': {
          id: 'loc-single-1',
          title: 'Billboard · Single Image Regression Check',
          type: 'billboard',
          address: '900 Test Ave, Testville',
          lat: 13.75,
          lng: 100.5,
          image_url: svg('%23FF5C00', 'COVER'),
          status: 'verified',
          status_updated_at: null,
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-single-1');
    await expect(
      page.getByRole('heading', { name: /Single Image Regression Check/i }),
    ).toBeVisible();

    // Exactly one image surface, no gallery grid, no lightbox trigger badge.
    await expect(page.locator('img[src^="data:image/svg"]')).toHaveCount(1);
    await expect(page.getByText(/^\d+ \/ \d+$/)).toHaveCount(0);

    await shot(page, testInfo, 'location-detail-single-image', { fullPage: true });

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
    expect(apiFailures, apiFailures.join('\n')).toEqual([]);
  });
});

test.describe('LocationDetail — multi-photo gallery', () => {
  test('renders hero + thumbnail grid and the lightbox opens/navigates', async ({
    page,
  }, testInfo) => {
    const apiFailures = trackApiFailures(page);
    const consoleErrors = trackConsoleErrors(page);

    const colors = ['%23FF5C00', '%2339FF14', '%231F51FF', '%23EDFF00', '%23FF0040', '%23B2B2B2'];
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-gallery-1': {
          id: 'loc-gallery-1',
          title: 'Billboard · Gallery Regression Check',
          type: 'billboard',
          address: '12 Gallery Rd, Testville',
          lat: 13.76,
          lng: 100.51,
          image_url: svg(colors[0], 'COVER'),
          status: 'verified',
          status_updated_at: null,
          access_key: 'none',
        },
      },
      locationPhotos: colors.slice(1).map((c, i) => ({
        id: `photo-${i + 1}`,
        location_id: 'loc-gallery-1',
        url: svg(c, String(i + 2)),
        caption: `Field photo ${i + 2}`,
        display_order: i,
        status: 'verified',
      })),
    });

    await page.goto('/location/loc-gallery-1');
    await expect(page.getByRole('heading', { name: /Gallery Regression Check/i })).toBeVisible();

    // Hero + up to 4 thumbnails + overflow badge (6 total photos: hero + 5 extra, thumb strip caps at 4 with a +N badge).
    const heroCountBadge = page.locator('span.absolute.bottom-2.right-2');
    await expect(heroCountBadge).toHaveText(/6/);
    const thumbs = page.locator('button:has(img[src^="data:image/svg"])');
    await expect(thumbs).toHaveCount(5); // hero button + 4 visible thumbnails

    await shot(page, testInfo, 'location-detail-gallery-grid', { fullPage: true });

    // Open lightbox from the hero image.
    await thumbs.first().click();
    await expect(page.getByText('1 / 6')).toBeVisible();
    await shot(page, testInfo, 'location-detail-gallery-lightbox');

    await page.getByRole('button', { name: /Next/i }).click();
    await expect(page.getByText('2 / 6')).toBeVisible();
    await expect(page.getByText('Field photo 2')).toBeVisible();

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
    expect(apiFailures, apiFailures.join('\n')).toEqual([]);
  });
});

test.describe('LocationDetail — rolling time-since-tag counter', () => {
  test('counter renders and ticks upward over time', async ({ page }, testInfo) => {
    const apiFailures = trackApiFailures(page);
    const consoleErrors = trackConsoleErrors(page);

    const taggedAt = new Date(Date.now() - 5000).toISOString(); // tagged 5s ago

    await mockBase44(page, {
      user: null,
      locations: {
        'loc-counter-1': {
          id: 'loc-counter-1',
          title: 'Billboard · Counter Regression Check',
          type: 'billboard',
          address: '77 Clock St, Testville',
          lat: 13.77,
          lng: 100.52,
          image_url: svg('%23EDFF00', 'COVER'),
          status: 'verified',
          status_updated_at: taggedAt,
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-counter-1');
    await expect(page.getByRole('heading', { name: /Counter Regression Check/i })).toBeVisible();

    const counter = page.getByText(/tagged .* ago/i);
    await expect(counter).toBeVisible();
    const first = await counter.textContent();

    await shot(page, testInfo, 'location-detail-counter-t0');
    await page.waitForTimeout(2000);
    await shot(page, testInfo, 'location-detail-counter-t2');

    const second = await counter.textContent();
    expect(second, 'counter text should change after 2s if it is actually ticking').not.toEqual(
      first,
    );

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
    expect(apiFailures, apiFailures.join('\n')).toEqual([]);
  });

  test('counter is absent for pending / never-tagged locations', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-pending-1': {
          id: 'loc-pending-1',
          title: 'Billboard · Pending No Counter',
          type: 'billboard',
          lat: 13.78,
          lng: 100.53,
          status: 'pending',
          status_updated_at: null,
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-pending-1');
    await expect(page.getByRole('heading', { name: /Pending No Counter/i })).toBeVisible();
    await expect(page.getByText(/tagged .* ago/i)).toHaveCount(0);
  });
});

test.describe('LocationDetail — react-query migration regression', () => {
  test('revisiting via client-side nav does not re-fetch the record within staleTime', async ({
    page,
  }) => {
    test.setTimeout(30_000);

    await mockBase44(page, {
      user: null,
      locations: {
        'loc-cache-1': {
          id: 'loc-cache-1',
          title: 'Billboard · Cache Regression Check',
          type: 'billboard',
          address: '1 Cache Way, Testville',
          lat: 13.79,
          lng: 100.54,
          image_url: svg('%2339FF14', 'COVER'),
          status: 'verified',
          status_updated_at: null,
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    // Exact match on this specific record's GET endpoint -- Location.get(id)
    // hits /entities/Location/{id} directly, a different URL shape from any
    // list/filter call (/entities/Location?...), so no other page or widget
    // can produce a same-URL false positive the way FieldId's bare
    // Operative.list() endpoint could (see field-id.spec.ts).
    let locationGetCalls = 0;
    page.on('request', (req) => {
      if (req.url().endsWith('/entities/Location/loc-cache-1')) locationGetCalls++;
    });

    await page.goto('/location/loc-cache-1');
    await expect(page.getByRole('heading', { name: /Cache Regression Check/i })).toBeVisible();
    const afterFirstVisit = locationGetCalls;
    expect(afterFirstVisit).toBe(1);

    // Client-side nav away, then back -- same SPA session, same QueryClient
    // instance, no full page reload. This app's route transition
    // (AnimatePresence mode="wait" + React.lazy chunks) takes several
    // seconds, not milliseconds, to actually unmount the previous route --
    // verified live with mount/unmount console markers for the sibling
    // FieldId investigation (KNOWN_ISSUES #16). A short wait here would
    // pass regardless of staleTime, for the wrong reason (the component
    // simply hasn't unmounted yet).
    //
    // Nav target is Home ("OOH Earth — Home console"), not the "Field map"
    // icon link -- that link is `hidden md:flex` in Nav.jsx, invisible (and
    // unclickable) on the mobile-chromium viewport this suite also runs
    // under. Home is safe here unlike in field-id.spec.ts: Location.get(id)
    // hits a per-record URL no other page/widget shares, so there's no
    // FieldIdGenerator-style confound to isolate away from.
    await page.getByLabel('OOH Earth — Home console').click();
    await page.waitForURL('**/', { timeout: 5000 });
    await page.waitForTimeout(6000);
    await page.goBack();
    await expect(page.getByRole('heading', { name: /Cache Regression Check/i })).toBeVisible();
    await page.waitForTimeout(500);

    expect(
      locationGetCalls,
      `Location.get() should not fire again within staleTime on a genuine remount (was ${afterFirstVisit}, now ${locationGetCalls})`,
    ).toBe(afterFirstVisit);
  });
});

test.describe('LocationDetail — mobile actions and sharing', () => {
  test('mobile header has one stable action row and native share uses the canonical public URL', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          (window as unknown as { sharedData: ShareData }).sharedData = data;
        },
      });
    });
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-share-1': {
          id: 'loc-share-1',
          title: 'Digital display · Share regression',
          type: 'digital',
          address: '1 Public Way, Testville',
          lat: 13.75,
          lng: 100.5,
          image_url: svg('%23EDFF00', 'COVER'),
          status: 'verified',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-share-1');
    await expect(page.getByRole('heading', { name: /Share regression/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share location' })).toHaveCount(1);
    await page.getByRole('button', { name: 'Share location' }).click();
    await expect
      .poll(() => page.evaluate(() => (window as any).sharedData?.url))
      .toBe('https://oohearth.app/location/loc-share-1');
    await expect(page.evaluate(() => (window as any).sharedData?.text)).resolves.toContain(
      'Digital display · Share regression',
    );
  });

  test('copy fallback shares only the canonical URL and exposes feedback', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (text: string) => ((window as any).copied = text) },
      });
    });
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-copy-1': {
          id: 'loc-copy-1',
          title: 'Billboard · Copy regression',
          type: 'billboard',
          notes: 'private operator note must not be shared',
          lat: 13.75,
          lng: 100.5,
          status: 'verified',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-copy-1');
    await page.getByRole('button', { name: 'Share location' }).click();
    await expect(page.getByRole('status')).toHaveText('Link copied');
    await expect
      .poll(() => page.evaluate(() => (window as any).copied))
      .toBe('https://oohearth.app/location/loc-copy-1');
  });
});
