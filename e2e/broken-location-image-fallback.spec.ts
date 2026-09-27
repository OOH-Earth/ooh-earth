import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// Regression test for Dave's mobile "black square" report: the flat map's
// photo marker (LocationMap.jsx's pinFor()) and its Leaflet popup
// (LocationThumb.jsx's thumbHTML()) both rendered a plain <img> with no
// onerror handling, against an explicitly dark/black container background.
// A meaningful subset of real production records only ever had a resized
// image derivative stored (e.g. "...-768x1024.jpg") — pinFor() used to strip
// that suffix to request what it assumed was a higher-resolution original,
// which 404s for those records (confirmed live: every sampled stripped URL
// returned 404; 13 real production locations carry this exact shape). With
// no fallback, the failed <img> left its dark background showing through as
// a solid black rectangle/circle exactly where the photo should be.
//
// Fix: (1) root cause — pinFor() no longer strips the resize suffix, so it
// requests the same URL that's already known to load; (2) defense in depth —
// both pinFor() and thumbHTML() (plus the React LocationThumb used by
// LocationCard/the bottom sheet) now render the existing "no photo" glyph
// placeholder as a base layer and overlay the photo on top of it, so *any*
// image failure (this one or a future one) reveals the designed placeholder
// instead of a bare black box, at the same fixed dimensions (no layout
// shift).
//
// This test mocks the image request itself to 404 (independent of whether
// the real media host is currently affected), so it stays a meaningful
// regression check regardless of production data changing over time.

const BROKEN_IMAGE_URL = 'https://media.base44.com/images/public/test-app/broken_photo.jpg';
const WORKING_IMAGE_URL = 'https://media.base44.com/images/public/test-app/working_photo.jpg';

// LocationMap.jsx's flat map uses a fixed initial center ([13.746, 100.55])
// and fitBounds={false} -- ClusteredMarkers only mounts real <Marker>s near
// that center for performance, so a fixture record needs coordinates close
// to it to actually reach the DOM (confirmed empirically: a point ~5km away
// never mounted within 15s, the exact center does immediately).
const MAP_CENTER = { lat: 13.746, lng: 100.55 };

async function mockImages(page: import('@playwright/test').Page) {
  await page.route(BROKEN_IMAGE_URL, (route) => route.fulfill({ status: 404, body: 'not found' }));
  await page.route(WORKING_IMAGE_URL, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      // 1x1 transparent PNG — a real, decodable image.
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
}

test.describe('Map — broken location photo degrades to the designed placeholder, not a black box', () => {
  test('flat-map marker: broken image is removed, category glyph fallback shows, size unchanged', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await mockImages(page);

    await mockBase44(page, {
      user: null,
      locations: {
        'loc-broken': {
          id: 'loc-broken',
          title: 'Broken Photo Billboard',
          type: 'billboard',
          address: '1 Test St',
          lat: MAP_CENTER.lat,
          lng: MAP_CENTER.lng,
          image_url: BROKEN_IMAGE_URL,
          status: 'verified',
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.addInitScript(() => {
      localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
    });
    // ?highlight= reliably drives this location through the same
    // select+fly-to path a real pin click uses (see
    // map-contribution-highlight.spec.ts) -- more deterministic than relying
    // on organic viewport-driven marker loading for a single test fixture
    // record.
    await page.goto('/map?highlight=loc-broken');

    const marker = page.locator('.ooh-pin--photo').first();
    await expect(marker).toBeAttached({ timeout: 15_000 });

    // The broken <img> must not remain in the DOM (its onerror removes it) —
    // this is the direct proof the black box can no longer appear, since
    // nothing is left painting the dark container background uncovered.
    await expect(marker.locator('img')).toHaveCount(0, { timeout: 10_000 });

    // The category glyph fallback (an inline <svg>, same as the "no photo"
    // pin style) must be visible in its place.
    await expect(marker.locator('svg').first()).toBeVisible();

    // Dimensions must be stable — this asserts against the exact non-selected
    // marker size pinFor() renders (52px), not a shrunk/collapsed box.
    const box = await marker.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(50);
    expect(box?.height).toBeGreaterThanOrEqual(50);

    // A 404 on an <img> is a browser-level resource-load failure, not a
    // console.error our own code emits — assert no *app* error surfaced.
    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });

  test('flat-map marker: working image still renders normally (no regression)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockImages(page);

    await mockBase44(page, {
      user: null,
      locations: {
        'loc-ok': {
          id: 'loc-ok',
          title: 'Working Photo Billboard',
          type: 'billboard',
          address: '1 Test St',
          lat: MAP_CENTER.lat,
          lng: MAP_CENTER.lng,
          image_url: WORKING_IMAGE_URL,
          status: 'verified',
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.addInitScript(() => {
      localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
    });
    await page.goto('/map?highlight=loc-ok');

    const marker = page.locator('.ooh-pin--photo').first();
    await expect(marker).toBeAttached({ timeout: 15_000 });
    const img = marker.locator('img');
    await expect(img).toHaveCount(1);
    await expect
      .poll(async () => img.evaluate((el: HTMLImageElement) => el.naturalWidth), {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
  });

  test('bottom-sheet detail card (LocationThumb): broken image falls back, no broken-image icon', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockImages(page);

    await mockBase44(page, {
      user: null,
      locations: {
        'loc-broken': {
          id: 'loc-broken',
          title: 'Broken Photo Billboard',
          type: 'billboard',
          address: '1 Test St',
          lat: MAP_CENTER.lat,
          lng: MAP_CENTER.lng,
          image_url: BROKEN_IMAGE_URL,
          status: 'verified',
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/map?highlight=loc-broken');
    await expect(page.getByText('// pin detail')).toBeVisible({ timeout: 10_000 });

    // LocationCard renders LocationThumb inside the detail sheet — same
    // onError -> fallback-glyph contract as the map marker. No <img> pointed
    // at the broken URL should remain attached anywhere on the page.
    await expect(page.locator(`img[src="${BROKEN_IMAGE_URL}"]`)).toHaveCount(0, {
      timeout: 10_000,
    });
  });
});
