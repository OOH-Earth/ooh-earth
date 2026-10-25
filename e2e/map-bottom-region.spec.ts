import { test, expect, type Page } from '@playwright/test';
import { openMapWithMock, probeMap, type Probe, type Item } from './helpers/mapGeometry';

// Bottom-region ownership on /map. The mobile bottom sheet, the zoom/attribution controls and the
// flat-view spec bar used to be independent layers over the same pixels. Map.jsx now measures the
// sheet and the spec bar and publishes --map-sheet-overlap / --map-specs-h; every bottom control
// stacks above them. These specs assert real DOM bounds and hit-testing, and drive the real
// controls (no forced or dispatched clicks).

const PHONES: [number, number, number][] = [
  [320, 640, 3],
  [360, 640, 3],
  [390, 844, 3],
  [430, 932, 3],
  [820, 1180, 2],
];

const item = (p: Probe, name: string): Item => {
  const found = p.items.find((i) => i.name === name);
  expect(found, `${name} is present and visible (missing: ${p.missing.join(',')})`).toBeTruthy();
  return found!;
};

function expectUsable(p: Probe, name: string) {
  const i = item(p, name);
  expect(i.hit, `${name} must be the topmost element at its centre and corners`).toBe('ok');
  if (!name.includes('attribution')) {
    // WCAG 2.2 AA 2.5.8 floor; the project goal is 40-44px, asserted where we own the control.
    expect(i.rect.w, `${name} width`).toBeGreaterThanOrEqual(24);
    expect(i.rect.h, `${name} height`).toBeGreaterThanOrEqual(24);
  }
  if (p.sheet) {
    expect(
      i.rect.y + i.rect.h,
      `${name} must sit above the sheet (sheet top ${Math.round(p.sheet.y)})`,
    ).toBeLessThanOrEqual(p.sheet.y + 0.5);
  }
  expect(i.rect.y, `${name} below the top of the viewport`).toBeGreaterThanOrEqual(0);
}

async function sheetHeight(page: Page) {
  return (await page.locator('.ooh-bottom-sheet').boundingBox())?.height ?? 0;
}

for (const [w, h, dpr] of PHONES) {
  test.describe(`bottom region @ ${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true });

    test('flat: Leaflet zoom and attribution stack above the sheet', async ({ page }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const p = await probeMap(page);
      for (const n of ['leaflet-zoom-in', 'leaflet-zoom-out', 'leaflet-attribution']) {
        expectUsable(p, n);
      }
      expect(p.hScroll, 'no horizontal page scroll').toBe(false);
    });

    test('globe: zoom, compass, spin and attribution stack above the sheet', async ({ page }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'globe' });
      const p = await probeMap(page);
      for (const n of [
        'globe-zoom-in',
        'globe-zoom-out',
        'globe-reset-north',
        'globe-auto-spin',
        'globe-attribution',
      ]) {
        expectUsable(p, n);
      }
    });

    test('sheet header: real clicks expand and collapse; targets are at least 40px', async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const sheet = page.locator('.ooh-bottom-sheet');
      const peek = await sheetHeight(page);
      const expand = sheet.getByRole('button', { name: 'Expand sheet' });
      const box = (await expand.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(40);
      expect(box.height).toBeGreaterThanOrEqual(40);
      await expand.click(); // used to be dead: the drag handle captured the pointer
      await expect.poll(() => sheetHeight(page)).toBeGreaterThan(peek + 50);
      await sheet.getByRole('button', { name: 'Collapse sheet' }).click();
      await expect.poll(() => sheetHeight(page)).toBeLessThanOrEqual(peek + 1);
    });

    test('error: Retry view is in the always-visible header and recovers the view', async ({
      page,
    }) => {
      test.setTimeout(90_000);
      const control = await openMapWithMock(page, { view: 'flat', fail: true });
      const sheet = page.locator('.ooh-bottom-sheet');
      const retry = sheet.getByRole('button', { name: 'Retry view' });
      await expect(retry).toBeVisible();
      await expect(sheet.locator('[role="alert"]')).toHaveCount(1); // announced once, not twice
      const p = await probeMap(page);
      // Retry lives in the sheet header: it must be fully inside the sheet and unobstructed
      const rv = item(p, 'retry-view');
      expect(rv.hit, 'retry-view must be the topmost element at its centre and corners').toBe('ok');
      expect(rv.rect.h).toBeGreaterThanOrEqual(40);
      expect(rv.rect.y).toBeGreaterThanOrEqual(p.sheet!.y - 0.5);
      expect(rv.rect.y + rv.rect.h).toBeLessThanOrEqual(p.sheet!.y + p.sheet!.h + 0.5);
      expect(rv.rect.y + rv.rect.h, 'above the bottom nav').toBeLessThanOrEqual(p.nav!.y + 0.5);

      const before = control.locationRequests;
      await retry.click(); // still failing: must re-request and stay recoverable
      await expect.poll(() => control.locationRequests).toBeGreaterThan(before);
      await expect(retry).toBeVisible();

      control.failing = false; // data comes back
      await retry.click();
      await expect(sheet.getByRole('button', { name: 'Retry view' })).toHaveCount(0, {
        timeout: 15_000,
      });
      await expect(sheet.locator('[role="alert"]')).toHaveCount(0);
    });

    test('sheet header stays on screen at every snap, so Collapse is always reachable', async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const sheet = page.locator('.ooh-bottom-sheet');
      await sheet.getByRole('button', { name: 'Expand sheet' }).click();
      await expect.poll(() => sheetHeight(page)).toBeGreaterThan(200);
      const box = (await sheet.boundingBox())!;
      expect(box.y, 'sheet top must be inside the viewport').toBeGreaterThanOrEqual(0);
      const collapse = sheet.getByRole('button', { name: 'Collapse sheet' });
      const cb = (await collapse.boundingBox())!;
      expect(cb.y).toBeGreaterThanOrEqual(0);
      await collapse.click(); // real click: it used to sit above the viewport on short screens
      await expect.poll(() => sheetHeight(page)).toBeLessThan(box.height - 50);
    });

    test('full sheet covers the map: map content is inert, then returns on collapse', async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const map = page.locator('[data-tour="map"]');
      await expect(map).not.toHaveAttribute('inert', /.*/);
      await page.locator('.ooh-bottom-sheet').getByRole('button', { name: 'Expand sheet' }).click();
      await expect(map).toHaveAttribute('data-map-covered', 'true');
      await expect(map).toHaveAttribute('inert', /.*/);
      // keyboard focus must never land on a control the sheet is covering
      let landedInMap = false;
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press('Tab');
        landedInMap ||= await page.evaluate(() => {
          const a = document.activeElement;
          return !!a && !!a.closest('[data-tour="map"]');
        });
      }
      expect(landedInMap, 'focus entered the covered map').toBe(false);
      await page
        .locator('.ooh-bottom-sheet')
        .getByRole('button', { name: 'Collapse sheet' })
        .click();
      await expect(map).toHaveAttribute('data-map-covered', 'false');
      await expect(map).not.toHaveAttribute('inert', /.*/);
    });
  });
}

test.describe('bottom region @ laptop 1440x900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('flat: spec bar sits clear of the zoom controls and attribution', async ({ page }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    const p = await probeMap(page);
    for (const n of ['leaflet-zoom-in', 'leaflet-zoom-out', 'leaflet-attribution']) {
      expectUsable(p, n);
    }
    const specs = await page.locator('[data-map-specs]').boundingBox();
    expect(specs, 'spec bar is present on the flat map').toBeTruthy();
    for (const n of ['leaflet-zoom-in', 'leaflet-zoom-out', 'leaflet-attribution']) {
      const r = item(p, n).rect;
      const overlap = r.y + r.h > specs!.y + 0.5 && r.y < specs!.y + specs!.height - 0.5;
      expect(overlap, `${n} must not sit on the spec bar`).toBe(false);
    }
  });

  test('error: Retry view is in the results panel, visible and actionable', async ({ page }) => {
    test.setTimeout(90_000);
    const control = await openMapWithMock(page, { view: 'flat', fail: true });
    const retry = page.getByRole('button', { name: 'Retry view' });
    await expect(retry).toBeVisible();
    const p = await probeMap(page);
    expectUsable(p, 'retry-view');
    control.failing = false;
    await retry.click();
    await expect(retry).toHaveCount(0, { timeout: 15_000 });
  });
});

// Short landscape: the shared header (112px) and bottom nav (76px) take ~190px of a 390px screen,
// which this page cannot change (UI-012). What it controls must still work, and the map must keep a
// usable band. Usability target (project preference): every primary control reachable without
// scrolling the page, the collapsed sheet header-only (<= 64px), and at least 64px of unobstructed
// map height across the full width between the controls row and the sheet. Before this work that
// band was 19-34px with the Field attention row covered by the sheet.
for (const [w, h] of [
  [844, 390],
  [667, 375],
] as const) {
  test.describe(`short landscape @ ${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true });

    for (const view of ['flat', 'globe'] as const) {
      test(`${view}: primary controls reachable, header-only sheet, usable map band`, async ({
        page,
      }) => {
        test.setTimeout(90_000);
        await openMapWithMock(page, { view });
        const p = await probeMap(page);
        for (const n of [
          'flat-globe#0',
          'flat-globe#1',
          'tools-toggle',
          'toolbar-graffiti',
          'toolbar-capture',
          'toolbar-report',
        ]) {
          const i = item(p, n);
          expect(i.hit, `${n} must be topmost at its centre and corners`).toBe('ok');
          expect(i.rect.y + i.rect.h).toBeLessThanOrEqual(h);
          expect(i.rect.h, `${n} height`).toBeGreaterThanOrEqual(40);
        }
        expect(p.sheet!.h, 'collapsed sheet is header-only').toBeLessThanOrEqual(64);
        expect(p.freeMapHeight!, 'unobstructed map band').toBeGreaterThanOrEqual(64);
        const bottom =
          view === 'flat'
            ? ['leaflet-zoom-in', 'leaflet-zoom-out', 'leaflet-attribution']
            : ['globe-zoom-in', 'globe-zoom-out', 'globe-reset-north', 'globe-auto-spin'];
        for (const n of bottom) expectUsable(p, n);
        expect(p.hScroll).toBe(false);
      });
    }

    test('sheet: expand keeps the header on screen and Collapse works', async ({ page }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'flat' });
      const sheet = page.locator('.ooh-bottom-sheet');
      await sheet.getByRole('button', { name: 'Expand sheet' }).click();
      await expect.poll(() => sheetHeight(page)).toBeGreaterThan(150);
      expect((await sheet.boundingBox())!.y).toBeGreaterThanOrEqual(0);
      await sheet.getByRole('button', { name: 'Collapse sheet' }).click();
      await expect.poll(() => sheetHeight(page)).toBeLessThanOrEqual(64);
    });

    test('error: Retry view sits inline in the header row and the sheet stays header-only', async ({
      page,
    }) => {
      test.setTimeout(90_000);
      const control = await openMapWithMock(page, { view: 'flat', fail: true });
      const sheet = page.locator('.ooh-bottom-sheet');
      const retry = sheet.getByRole('button', { name: 'Retry view' });
      await expect(retry).toBeVisible();
      expect(await sheetHeight(page)).toBeLessThanOrEqual(64);
      await expect(sheet.locator('[role="alert"]')).toHaveCount(1);
      const p = await probeMap(page);
      expect(item(p, 'retry-view').hit).toBe('ok');
      control.failing = false;
      await retry.click();
      await expect(sheet.getByRole('button', { name: 'Retry view' })).toHaveCount(0, {
        timeout: 15_000,
      });
    });
  });
}

test.describe('sheet focus handoff @ 390x844', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('Expand then Collapse keep keyboard focus inside the sheet and the map is usable again', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await openMapWithMock(page, { view: 'flat' });
    const sheet = page.locator('.ooh-bottom-sheet');
    await sheet.getByRole('button', { name: 'Expand sheet' }).click();
    await expect(sheet.getByRole('button', { name: 'Collapse sheet' })).toBeFocused();
    await sheet.getByRole('button', { name: 'Collapse sheet' }).click();
    await expect(sheet.getByRole('button', { name: 'Expand sheet' })).toBeFocused();
    const map = page.locator('[data-tour="map"]');
    await expect(map).toHaveAttribute('data-map-covered', 'false');
    await expect(map).not.toHaveJSProperty('inert', true);
  });
});

for (const [w, h] of [
  [844, 390],
  [932, 430],
] as const) {
  test.describe(`globe attribution text @ ${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h }, hasTouch: true });

    test('the control row does not sit on top of the attribution line', async ({ page }) => {
      test.setTimeout(90_000);
      await openMapWithMock(page, { view: 'globe' });
      const rects = await page.evaluate(() => {
        const box = (e: Element | null) => {
          if (!e) return null;
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        return {
          attrib: box(document.querySelector('.maplibregl-ctrl-attrib')),
          controls: ['Zoom in', 'Zoom out', 'Reset north', 'Auto-spin'].map((n) =>
            box(document.querySelector(`[aria-label="${n}"]`)),
          ),
        };
      });
      expect(rects.attrib, 'attribution present').toBeTruthy();
      for (const c of rects.controls) {
        if (!c) continue;
        const a = rects.attrib!;
        const overlap =
          Math.min(a.x + a.w, c.x + c.w) > Math.max(a.x, c.x) &&
          Math.min(a.y + a.h, c.y + c.h) > Math.max(a.y, c.y);
        expect(overlap, 'a globe control must not cover the attribution text').toBe(false);
      }
    });
  });
}
