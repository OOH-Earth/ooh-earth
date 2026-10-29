import type { Page } from '@playwright/test';
import { mockBase44 } from '../fixtures/mockBase44';

// Shared geometry helpers for the map layout specs. Everything is measured from the real DOM:
// a control "passes" only if it exists, is visible, lies inside the area its owner allows,
// and is the topmost element at its centre and inset corners.

export type Rect = { x: number; y: number; w: number; h: number };
export type Item = {
  name: string;
  rect: Rect;
  hit: 'ok' | string; // 'ok' or a description of what covers it
  clipped?: string; // set when an ancestor's overflow clips part of the control
};
export type Probe = {
  vw: number;
  vh: number;
  dpr: number;
  map: Rect | null;
  sheet: Rect | null;
  nav: Rect | null;
  frameBottom: number | null;
  freeMapHeight: number | null; // map box above the sheet, below the overlay frame
  items: Item[];
  missing: string[];
  fixedNearBottom: { d: string; rect: Rect; z: string }[];
  hScroll: boolean;
};

export const ITEM_SELECTORS: Record<string, string> = {
  'sheet-expand': '.ooh-bottom-sheet [aria-label="Expand list"]',
  'sheet-collapse': '.ooh-bottom-sheet [aria-label="Collapse list"]',
  'sheet-fullscreen':
    '.ooh-bottom-sheet [aria-label="Full-screen map (hides navigation)"], .ooh-bottom-sheet [aria-label="Exit full-screen map (shows navigation)"]',
  'sheet-close-detail': '.ooh-bottom-sheet [aria-label="Close detail"]',
  'retry-view': '', // matched by text in probeMap
  'leaflet-zoom-in': '.leaflet-control-zoom-in',
  'leaflet-zoom-out': '.leaflet-control-zoom-out',
  'leaflet-attribution': '.leaflet-control-attribution',
  'globe-zoom-in': '[aria-label="Zoom in"]',
  'globe-zoom-out': '[aria-label="Zoom out"]',
  'globe-reset-north': '[aria-label="Reset north"]',
  'globe-auto-spin': '[aria-label="Auto-spin"]',
  'globe-attribution': '[aria-label="Toggle attribution"]',
  'nudge-execute': '[class*="z-[70]"] a[href="/report"]',
  'nudge-abort': '[class*="z-[70]"] [aria-label="Abort"]',
  'field-attention': '[data-testid="field-attention-toggle"]',
  'toolbar-report': '[data-map-toolbar] a[aria-label="Report"]',
  'flat-globe': '[aria-label="Flat map"], [aria-label="Globe view"]',
  'tools-toggle': '[data-testid="map-tools-toggle"]',
  'toolbar-graffiti': '[data-map-toolbar] [aria-label="Graffiti camera"]',
  'toolbar-capture': '[data-map-toolbar] [aria-label="Capture photo"]',
};

export async function openMapWithMock(
  page: Page,
  opts: {
    view?: 'flat' | 'globe';
    fail?: boolean;
    nudge?: 'shown' | 'dismissed';
    locations?: number;
    tally?: boolean;
  } = {},
) {
  const { view = 'flat', fail = false, nudge = 'dismissed', locations = 6, tally = false } = opts;
  await page.addInitScript(
    ([n, t]) => {
      if (n === 'dismissed') localStorage.setItem('ooh_nudge_map_report', '1');
      localStorage.setItem('ooh-tally-open', t ? 'true' : 'false');
    },
    [nudge, tally] as const,
  );
  const locs: Record<string, unknown> = {};
  for (let i = 0; i < locations; i++) {
    locs[`loc-${i}`] = {
      id: `loc-${i}`,
      title:
        i === 0
          ? 'A deliberately very long location title that must wrap and not push controls out of the sheet'
          : `Location ${i}`,
      type: 'billboard',
      address: `${i + 1} Field Way`,
      lat: 13.7563 + i * 0.002,
      lng: 100.5018 + i * 0.002,
      status: 'pending',
      created_date: '2020-01-01T00:00:00.000Z',
    };
  }
  await mockBase44(page, { user: null, locations: locs, fieldChecks: {} });
  // `control.failing` can be flipped mid-test to exercise the real Retry -> recovery path.
  const control = { failing: fail, locationRequests: 0 };
  await page.route('**/api/apps/**/entities/Location**', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    control.locationRequests += 1;
    return control.failing
      ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"forced"}' })
      : route.fallback();
  });
  await page.goto('/map');
  await page.getByRole('button', { name: 'Flat map' }).first().waitFor({ timeout: 30_000 });
  await page
    .getByRole('button', { name: view === 'flat' ? 'Flat map' : 'Globe view' })
    .first()
    .click();
  await page.waitForTimeout(view === 'globe' ? 1800 : 1200);
  return control;
}

export async function probeMap(page: Page): Promise<Probe> {
  return page.evaluate((selectors) => {
    const r2 = (e: Element): Rect => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    };
    type Rect = { x: number; y: number; w: number; h: number };
    const desc = (e: Element | null) =>
      e
        ? `<${e.tagName.toLowerCase()}${e.getAttribute('aria-label') ? ` "${e.getAttribute('aria-label')}"` : ''} ${String(
            e.className || '',
          )
            .toString()
            .slice(0, 48)}>`
        : 'nothing';
    const vis = (e: Element) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const map = document.querySelector('[data-tour="map"]');
    const sheet = document.querySelector('.ooh-bottom-sheet');
    const nav = document.querySelector('nav[aria-label="Mobile navigation"]');
    const frame = document.querySelector('[data-map-toolbar]')?.parentElement?.parentElement;
    const items: any[] = [];
    const missing: string[] = [];
    // clip-aware visible rect: intersect with every scrollable/clipping ancestor
    const clipOf = (e: Element) => {
      let r = e.getBoundingClientRect();
      let L = r.left,
        T = r.top,
        R = r.right,
        B = r.bottom;
      let p = e.parentElement;
      let by = '';
      while (p && p !== document.documentElement) {
        const s = getComputedStyle(p);
        if (/(auto|scroll|hidden|clip)/.test(s.overflowY + s.overflowX)) {
          const pr = p.getBoundingClientRect();
          const nl = Math.max(L, pr.left),
            nt = Math.max(T, pr.top),
            nr = Math.min(R, pr.right),
            nb = Math.min(B, pr.bottom);
          if (nb - nt < B - T - 2 || nr - nl < R - L - 2) by = by || desc(p);
          L = nl;
          T = nt;
          R = nr;
          B = nb;
        }
        p = p.parentElement;
      }
      return { vis: { x: L, y: T, w: Math.max(0, R - L), h: Math.max(0, B - T) }, by };
    };
    for (const [name, sel] of Object.entries(selectors)) {
      let els: Element[] = [];
      if (name === 'retry-view')
        els = [...document.querySelectorAll('button')].filter((b) =>
          /retry view/i.test(b.textContent || ''),
        );
      else els = [...document.querySelectorAll(sel)];
      els = els.filter(vis);
      if (!els.length) {
        missing.push(name);
        continue;
      }
      els.forEach((e, i) => {
        if (e.closest('[inert]')) {
          items.push({ name: els.length > 1 ? `${name}#${i}` : name, rect: r2(e), hit: 'inert' });
          return;
        }
        const r = e.getBoundingClientRect();
        const c = clipOf(e);
        const pts = [
          [r.x + r.width / 2, r.y + r.height / 2],
          [r.x + 2, r.y + 2],
          [r.right - 2, r.y + 2],
          [r.x + 2, r.bottom - 2],
          [r.right - 2, r.bottom - 2],
        ];
        let hit = 'ok';
        // the compact attribution control is a round button: its square corners are not part of it
        for (const [px, py] of name.includes('attribution') ? pts.slice(0, 1) : pts) {
          if (px < 0 || py < 0 || px >= innerWidth || py >= innerHeight) {
            hit = `outside viewport at (${Math.round(px)},${Math.round(py)})`;
            break;
          }
          const top = document.elementFromPoint(px, py);
          if (
            top &&
            !(top === e || e.contains(top) || (name.includes('attribution') && top.contains(e)))
          ) {
            hit = `covered at (${Math.round(px)},${Math.round(py)}) by ${desc(top)}`;
            break;
          }
        }
        items.push({
          name: els.length > 1 ? `${name}#${i}` : name,
          rect: r2(e),
          hit,
          clipped: c.by || undefined,
        });
      });
    }
    const fixedNearBottom: any[] = [];
    document.querySelectorAll('body *').forEach((e) => {
      const s = getComputedStyle(e);
      if (s.position !== 'fixed' && s.position !== 'sticky') return;
      const r = e.getBoundingClientRect();
      if (r.width < 10 || r.height < 10 || r.bottom < innerHeight - 220 || r.top > innerHeight)
        return;
      if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return;
      fixedNearBottom.push({ d: desc(e), rect: r2(e), z: s.zIndex });
    });
    const mapR = map ? r2(map) : null;
    const sheetR = sheet && getComputedStyle(sheet).display !== 'none' ? r2(sheet) : null;
    const fb = frame ? frame.getBoundingClientRect().bottom : null;
    let free: number | null = null;
    if (mapR) {
      const bottom = sheetR ? Math.min(mapR.y + mapR.h, sheetR.y) : mapR.y + mapR.h;
      free = Math.max(0, bottom - (fb ?? mapR.y));
    }
    return {
      vw: innerWidth,
      vh: innerHeight,
      dpr: devicePixelRatio,
      map: mapR,
      sheet: sheetR,
      nav: nav && vis(nav) ? r2(nav) : null,
      frameBottom: fb,
      freeMapHeight: free,
      items,
      missing,
      fixedNearBottom,
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  }, ITEM_SELECTORS) as Promise<Probe>;
}

// In compact chrome (phones, short landscape) the field-attention toggle, tally, news ticker and
// optional tools live behind a labelled "Tools" disclosure. Open it (idempotent); a no-op when the
// layout shows them inline.
export async function openMapTools(page: Page) {
  const toggle = page.getByTestId('map-tools-toggle');
  if (!(await toggle.count()) || !(await toggle.isVisible())) return;
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await page.locator('#map-tools-panel').waitFor({ state: 'visible' });
}
