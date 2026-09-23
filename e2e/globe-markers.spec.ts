import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// Regression test for the reopened mobile/desktop globe-markers incident:
// Globe3D.jsx (the shared MapLibre GL globe used by both Home's "Orbital
// Atlas" section and Map.jsx's default 'globe' view) never rendered a
// single marker, on any device or network, despite reporting a correct,
// non-zero spot count in its own HUD text. Root cause: maplibre-gl resolves
// its worker script by string-appending "maplibre-gl-worker.mjs" next to
// its own bundled chunk's URL at runtime (see maplibre-gl's
// util/web_worker.ts:defaultWorkerUrl) -- a literal, unhashed filename that
// Vite's content-hashed build output never produces. The GeoJSONSource's
// worker actor request 404s, so every setData() call hangs forever
// (isUpdatingWorker stays true, source.loaded() never becomes true) with
// no console error ever surfaced -- the reported spot count comes straight
// from the JS array length in GlobeSection.jsx, entirely independent of
// whether MapLibre ever finished processing that data. Fixed in
// src/lib/maplibreWorkerSetup.js via maplibregl.setWorkerUrl(), importing
// the worker file with Vite's `?worker&url` suffix so Vite bundles its own
// internal import graph correctly (a plain `?url` copy was tried first and
// was insufficient -- it fixes the outer 404 but leaves the worker's own
// internal `import ... from "./maplibre-gl-shared.mjs"` unrewritten, a
// second silent failure with the identical hangs-forever shape).
//
// This test inspects the actual MapLibre GeoJSON source state and rendered
// feature count -- not just canvas presence or a 200 on the Location
// fetch -- since both of those were already true before the fix and the
// bug was invisible to either check.

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// Finds the maplibregl.Map instance mounted by Globe3D.jsx by walking the
// React fiber tree up from the maplibre canvas container -- there is no
// public ref/handle exposed for this, and this is a read-only inspection
// of already-rendered state, not a hack around the app's real behavior.
// Returns the GeoJSON source's loaded/rendered state directly (a single
// real function passed to page.evaluate, not a stringified one -- a
// stringified arrow function silently failed to execute as expected here).
function readGlobeMarkerState() {
  const container = document.querySelector('.maplibregl-canvas-container');
  if (!container) return null;
  // The exact ancestor depth that first carries a React fiber key differs
  // between Globe3D's callers (Home's GlobeSection vs. Map.jsx wrap it at
  // different DOM depths) -- walk up until one is found instead of assuming
  // a fixed depth.
  let el: Element | null = container.parentElement;
  let fiberKey: string | undefined;
  while (el && !fiberKey) {
    fiberKey = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    if (!fiberKey) el = el.parentElement;
  }
  if (!el || !fiberKey) return null;
  let fiber: any = (el as any)[fiberKey];
  let hops = 0;
  let map: any = null;
  while (fiber && hops < 25 && !map) {
    let hook = fiber.memoizedState;
    let hookIdx = 0;
    while (hook && hookIdx < 40) {
      const ms = hook.memoizedState;
      if (ms && typeof ms === 'object' && ms !== null && 'current' in ms) {
        const val = ms.current;
        if (val && typeof val.getSource === 'function') map = val;
      }
      hook = hook.next;
      hookIdx++;
    }
    fiber = fiber.return;
    hops++;
  }
  if (!map) return null;
  const src = map.getSource('ooh-markers');
  if (!src) return null;
  return {
    loaded: src.loaded(),
    rendered:
      map.queryRenderedFeatures({ layers: ['ooh-markers'] }).length +
      map.queryRenderedFeatures({ layers: ['ooh-clusters'] }).length,
  };
}

const MOCK_LOCATIONS: MockDb['locations'] = {
  'loc-1': {
    id: 'loc-1',
    title: 'Ad scan · Test Billboard',
    type: 'billboard',
    status: 'verified',
    lat: 13.7563,
    lng: 100.5018,
    address: 'Bangkok, Thailand',
  },
  'loc-2': {
    id: 'loc-2',
    title: 'Field capture · Mural',
    type: 'mural',
    status: 'verified',
    lat: 51.5074,
    lng: -0.1278,
    address: 'London, UK',
  },
};

test.describe('Globe markers — worker-resolution regression', () => {
  test('Home "Orbital Atlas" globe renders real markers, not just a spot count', async ({
    page,
  }) => {
    test.setTimeout(45_000);
    const consoleErrors = trackConsoleErrors(page);
    const db: MockDb = { user: null, locations: MOCK_LOCATIONS };
    await mockBase44(page, db);

    const workerRequest = page.waitForResponse((res) => /maplibre-gl-worker/.test(res.url()));
    await page.goto('/');

    const globeSection = page.locator('[data-tour="globe"]');
    await globeSection.scrollIntoViewIfNeeded();
    await expect(page.getByText('2 spots')).toBeVisible({ timeout: 10_000 });

    const workerResponse = await workerRequest;
    expect(workerResponse.status(), 'maplibre-gl worker chunk must not 404').toBe(200);

    // The two mock locations are continents apart, so at this globe's
    // initial low zoom they legitimately cluster into a single feature --
    // asserting >=1 rendered feature (marker or cluster) is the correct
    // "did MapLibre actually paint something" check; asserting an exact
    // count of 2 would fail on correct clustering behavior, not on the bug.
    // Polling the rendered count directly (not loaded() alone) avoids a
    // real race: loaded() can flip true one animation frame before
    // queryRenderedFeatures reflects the newly-painted tile. Home mounts
    // ~25 widgets competing for main-thread time before this lazy-loaded
    // globe reaches its own 'load' event, so it gets a longer budget than
    // the single-purpose Map page test.
    await expect
      .poll(async () => (await page.evaluate(readGlobeMarkerState))?.rendered ?? 0, {
        timeout: 30_000,
        message: 'GeoJSON source never finished loading / never rendered a marker',
      })
      .toBeGreaterThan(0);

    expect(filterCrashes(consoleErrors)).toEqual([]);
  });

  test('Map page default globe view renders real markers', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    const db: MockDb = { user: null, locations: MOCK_LOCATIONS };
    await mockBase44(page, db);

    const workerRequest = page.waitForResponse((res) => /maplibre-gl-worker/.test(res.url()));
    await page.goto('/map');

    const workerResponse = await workerRequest;
    expect(workerResponse.status(), 'maplibre-gl worker chunk must not 404').toBe(200);

    await expect
      .poll(async () => (await page.evaluate(readGlobeMarkerState))?.rendered ?? 0, {
        timeout: 15_000,
        message: 'GeoJSON source never finished loading / never rendered a marker',
      })
      .toBeGreaterThan(0);

    expect(filterCrashes(consoleErrors)).toEqual([]);
  });

  test('Map flat mode is unaffected by the globe fix', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page);
    const db: MockDb = { user: null, locations: MOCK_LOCATIONS };
    await mockBase44(page, db);

    // Map.jsx persists its flat/globe choice via usePersistentState('ooh-map-view', 'globe')
    // (JSON-serialized localStorage). Pre-seeding it lands the page directly
    // in flat mode -- the map-style switcher control visually overlaps the
    // flat/globe toggle's own hit area on wider viewports, so driving this
    // through a real click is flaky for a concern this test isn't about.
    await page.addInitScript(() => {
      localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
    });
    await page.goto('/map');

    // Flat mode uses LocationMap.jsx (react-leaflet), a completely separate
    // rendering path from Globe3D/MapLibre -- confirms the fix didn't
    // regress the path Dave said already worked. Checking attachment
    // (not toBeVisible()) since Leaflet's own container sizing settles
    // asynchronously and that timing is unrelated to this fix.
    await expect(page.locator('.leaflet-container')).toBeAttached({ timeout: 10_000 });
    await expect
      .poll(() => page.locator('.leaflet-marker-icon').count(), { timeout: 10_000 })
      .toBeGreaterThan(0);
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });
});
