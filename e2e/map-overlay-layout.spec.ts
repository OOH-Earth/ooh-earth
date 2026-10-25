import { test, expect, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';
import { openMapTools, openMapWithMock, probeMap } from './helpers/mapGeometry';

// Map overlay layout contract. Asserts FULL element bounds (not label visibility):
//   1. no two overlay boxes intersect,
//   2. every box lies inside the map box and inside the viewport,
//   3. every interactive overlay control is the topmost element at its own centre
//      and at its four inset corners (nothing paints over any part of it),
//   4. no horizontal page scroll.
// "Zoom" rows emulate browser zoom by CSS-px viewport + deviceScaleFactor (what Chrome's
// Ctrl-+ does to layout): 200% of 1280x720 => 640x360 @2, 400% of 1280x800 => 320x200 @4.

const VIEWPORTS = [
  { name: 'phone 390x844', w: 390, h: 844, dpr: 3 },
  { name: 'reflow 320x640', w: 320, h: 640, dpr: 3 }, // WCAG 1.4.10 reflow width
  { name: 'phone-small 360x640', w: 360, h: 640, dpr: 3 },
  { name: 'tablet 820x1180', w: 820, h: 1180, dpr: 2 },
  { name: 'tablet-landscape 1024x768', w: 1024, h: 768, dpr: 2 },
  { name: 'laptop 1280x720', w: 1280, h: 720, dpr: 1 },
  { name: 'laptop 1440x900', w: 1440, h: 900, dpr: 1 },
  { name: 'short-landscape 844x390', w: 844, h: 390, dpr: 3 },
  { name: 'short-landscape 667x375', w: 667, h: 375, dpr: 2 },
  { name: 'zoom200 640x360@2', w: 640, h: 360, dpr: 2 },
];

type Box = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  interactive: boolean;
  inFrame: boolean;
  inSheet: boolean;
};

// The bottom sheet animates its height (320ms) and the frame republishes its measurements through
// a ResizeObserver. Wait until the sheet has actually reached its target height (the inline style
// is the target; the first frames of the transition still show the old height) and then give the
// observer a beat, before measuring.
async function settle(page: Page) {
  let stable = 0;
  for (let i = 0; i < 40 && stable < 2; i++) {
    const done = await page.evaluate(() => {
      const el = document.querySelector('.ooh-bottom-sheet') as HTMLElement | null;
      if (!el) return true; // no sheet on this layout
      return Math.abs(el.getBoundingClientRect().height - parseFloat(el.style.height)) < 1;
    });
    stable = done ? stable + 1 : 0;
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(250);
}

async function openMap(page: Page, view: 'flat' | 'globe') {
  // ContextualNudge is a separate shared overlay (fixed, bottom-centre) owned by the nudge/header
  // fix on fix/header-tablet-fit (15492b8). It is dismissed here so this spec measures the map
  // overlay frame in isolation; its overlap with the zoom controls is tracked by the nudge fixme at the bottom of this file.
  await page.addInitScript(() => {
    localStorage.setItem('ooh-tally-open', 'true');
    localStorage.setItem('ooh_nudge_map_report', '1');
  });
  await mockBase44(page, {
    user: null,
    locations: {
      'overlay-1': {
        id: 'overlay-1',
        title: 'Overlay location',
        type: 'billboard',
        address: '1 Field Way',
        lat: 13.7563,
        lng: 100.5018,
        status: 'pending',
        created_date: '2020-01-01T00:00:00.000Z',
      },
    },
    fieldChecks: {},
  });
  await page.goto('/map');
  // compact chrome gates the attention toggle behind the Tools disclosure; wait on the view switch
  await expect(page.getByRole('button', { name: 'Flat map' }).first()).toBeVisible({
    timeout: 30_000,
  });
  await page
    .getByRole('button', { name: view === 'flat' ? 'Flat map' : 'Globe view' })
    .first()
    .click();
  // let the frame observer publish and the globe HUD mount
  await page.waitForTimeout(600);
}

// Collects every overlay box in the map, evaluated in-page.
async function collect(page: Page) {
  return page.evaluate(() => {
    const map = document.querySelector('[data-tour="map"]') as HTMLElement;
    const mr = map.getBoundingClientRect();
    const vis = (e: Element) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const boxes: any[] = [];
    const frameEl = map.querySelector('[data-map-toolbar]')?.parentElement
      ?.parentElement as HTMLElement | null;
    if (frameEl) frameEl.scrollTop = 0;
    // Frame children are measured as the user sees them: clipped to the frame's own scroll box.
    const mapCovered = map.hasAttribute('inert');
    const sheetEl = document.querySelector('.ooh-bottom-sheet');
    const add = (name: string, e: Element | null | undefined, interactive: boolean) => {
      if (!e || !vis(e)) return;
      if (mapCovered && map.contains(e)) return; // covered by the sheet: inert, not interactive
      const r = e.getBoundingClientRect();
      let { x, y, width: w, height: h } = r;
      const inFrame = !!frameEl && frameEl.contains(e);
      if (!inFrame && sheetEl?.contains(e)) {
        // sheet-hosted: clip to the sheet's scrolling body; scrolled-out items are reachable by
        // scrolling (checked per-control below)
        let p: Element | null = e.parentElement;
        while (p && sheetEl.contains(p)) {
          const st = getComputedStyle(p);
          if (/(auto|scroll|hidden|clip)/.test(st.overflowY)) {
            const pr = p.getBoundingClientRect();
            const top = Math.max(y, pr.y);
            const bottom = Math.min(y + h, pr.bottom);
            if (bottom - top <= 0.5) return;
            y = top;
            h = bottom - top;
          }
          p = p.parentElement;
        }
      }
      if (inFrame) {
        // As the user sees it: clip to every scrolling/clipping ancestor inside the frame (the
        // frame itself on desktop, the Tools panel in compact chrome).
        let p: Element | null = e.parentElement;
        while ((p && frameEl!.contains(p)) || p === frameEl) {
          const st = getComputedStyle(p!);
          if (/(auto|scroll|hidden|clip)/.test(st.overflowY)) {
            const pr = p!.getBoundingClientRect();
            const top = Math.max(y, pr.y);
            const bottom = Math.min(y + h, pr.bottom);
            if (bottom - top <= 0.5) return; // scrolled out of view: reachable only by scrolling
            y = top;
            h = bottom - top;
          }
          if (p === frameEl) break;
          p = p!.parentElement;
        }
      }
      boxes.push({ name, x, y, w, h, interactive, inFrame, inSheet: !!sheetEl?.contains(e) });
    };
    const q = (sel: string) => Array.from(map.querySelectorAll(sel));
    add('view-switcher', map.querySelector('[aria-label="Flat map"]')?.parentElement, false);
    q('[aria-label="Flat map"], [aria-label="Globe view"]').forEach((e) =>
      add(e.getAttribute('aria-label')!, e, true),
    );
    add('field-attention', map.querySelector('[data-testid="field-attention-toggle"]'), true);
    add('attention-filters', map.querySelector('[data-testid="attention-filters"]'), true);
    add('tools-toggle', map.querySelector('[data-testid="map-tools-toggle"]'), true);
    // the Tools panel floats in the frame, or sits in the bottom sheet in short landscape
    const panelEl = document.querySelector('#map-tools-panel');
    add('tools-panel', panelEl, false);
    if (panelEl && sheetEl?.contains(panelEl)) {
      panelEl
        .querySelectorAll('button, [data-testid]:not([data-testid="attention-filters"])')
        .forEach((e, i) =>
          add(
            `sheet-tools:${e.getAttribute('data-testid') || e.getAttribute('aria-label') || i}`,
            e,
            true,
          ),
        );
    }
    q('[data-map-toolbar] button, [data-map-toolbar] a').forEach((e, i) =>
      add(`toolbar:${e.getAttribute('aria-label') || i}`, e, true),
    );
    const tally = map.querySelector(
      '[aria-label="Hide field tally"], [aria-label="Show field tally"]',
    );
    add('tally', tally?.closest('.pointer-events-auto'), false);
    add('tally-toggle', tally, true);
    const ticker = map.querySelector('[aria-label="Dismiss ticker"]');
    add('ticker', ticker?.closest('.pointer-events-auto') ?? ticker, false);
    const hud = Array.from(map.querySelectorAll('span')).find((e) =>
      /ORBITAL TELEMETRY/.test(e.textContent || ''),
    );
    add('hud-tl', hud?.parentElement?.parentElement, false);
    add('hud-tc', map.querySelector('[data-tour="hud-tel"]'), false);
    add('hud-air', map.querySelector('[data-tour="hud-pm25"]'), true);
    q(
      '[aria-label="Zoom in"], [aria-label="Zoom out"], [aria-label="Reset north"], [aria-label="Auto-spin"]',
    ).forEach((e) => add(`globe-control:${e.getAttribute('aria-label')}`, e, true));
    add('map-attention-card', map.querySelector('[data-testid="map-attention-card"]'), false);
    // Per-control check. Frame children are scrolled into view first (the frame scrolls when
    // the map is shorter than its content); then the control must be inside the map box and be
    // the topmost element at its centre and inset corners.
    const frame = map.querySelector('[data-map-toolbar]')?.parentElement
      ?.parentElement as HTMLElement | null;
    const checks: string[] = [];
    const inter = [
      ...map.querySelectorAll(
        '[data-map-toolbar] button, [data-map-toolbar] a, [aria-label="Flat map"], [aria-label="Globe view"], [data-testid="field-attention-toggle"], [aria-label="Hide field tally"], [aria-label="Show field tally"], [aria-label="Dismiss ticker"], [data-testid="attention-filters"] button, [data-testid="map-tools-toggle"], #map-tools-panel button',
      ),
      ...document.querySelectorAll(
        '.ooh-bottom-sheet #map-tools-panel button, .ooh-bottom-sheet #map-tools-panel a',
      ),
    ].filter((e) => vis(e) && !(mapCovered && map.contains(e)));
    for (const e of inter) {
      const label = e.getAttribute('aria-label') || e.textContent?.trim().slice(0, 20);
      e.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const r = e.getBoundingClientRect();
      const m = map.getBoundingClientRect();
      const fr = frame?.getBoundingClientRect();
      const sr = sheetEl?.contains(e) ? sheetEl.getBoundingClientRect() : null;
      if (sr) {
        // sheet-hosted control: bounded by the sheet, not the map box
        if (r.y < sr.y - 0.5 || r.bottom > sr.bottom + 0.5)
          checks.push(`${label} outside the sheet after scroll-into-view`);
      } else if (
        r.x < m.x - 0.5 ||
        r.y < m.y - 0.5 ||
        r.right > m.right + 0.5 ||
        r.bottom > m.bottom + 0.5
      )
        checks.push(`${label} outside the map box after scroll-into-view`);
      // compact chrome has no clipping frame (the Tools panel scrolls itself); the map box and
      // the sheet-top check below bound it instead
      const clipsToFrame = !!fr && getComputedStyle(frame!).overflowY !== 'visible';
      if (clipsToFrame && fr && (r.y < fr.y - 0.5 || r.bottom > fr.bottom + 0.5))
        checks.push(`${label} outside the frame's own clip after scroll-into-view`);
      const pts = [
        [r.x + r.width / 2, r.y + r.height / 2],
        [r.x + 2, r.y + 2],
        [r.right - 2, r.y + 2],
        [r.x + 2, r.bottom - 2],
        [r.right - 2, r.bottom - 2],
      ];
      for (const [px, py] of pts) {
        if (px < 0 || py < 0 || px > innerWidth || py > innerHeight) {
          checks.push(`${label} outside the viewport`);
          break;
        }
        const top = document.elementFromPoint(px, py);
        if (top && !(e === top || e.contains(top))) {
          checks.push(
            `${label} covered at (${Math.round(px)},${Math.round(py)}) by <${top.tagName.toLowerCase()} ${(top.getAttribute('aria-label') || top.className || '').toString().slice(0, 50)}>`,
          );
          break;
        }
      }
    }
    if (frame) frame.scrollTop = 0;
    const covered = checks;
    return {
      vw: innerWidth,
      vh: innerHeight,
      map: { x: mr.x, y: mr.y, w: mr.width, h: mr.height },
      boxes,
      covered,
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      overlayBottomVar: map.style.getPropertyValue('--map-overlay-bottom'),
      frameBottom: (() => {
        const f = map.querySelector('[data-map-toolbar]')?.parentElement?.parentElement;
        return f ? f.getBoundingClientRect().bottom - mr.top : null;
      })(),
    };
  });
}

function assertLayout(r: Awaited<ReturnType<typeof collect>>, label: string) {
  const problems: string[] = [];
  const E = 0.5;
  const names = r.boxes.map((b: Box) => b.name);
  // containers that legitimately wrap their children are skipped for pair checks
  const skip = new Set(['view-switcher', 'tools-panel']);
  const leaf = r.boxes.filter((b: Box) => !skip.has(b.name));
  for (let i = 0; i < leaf.length; i++) {
    const a = leaf[i];
    // inside the map box + viewport (frame children are checked per-control after scroll-into-view)
    if (
      !a.inFrame &&
      !a.inSheet &&
      (a.x < r.map.x - E ||
        a.y < r.map.y - E ||
        a.x + a.w > r.map.x + r.map.w + E ||
        a.y + a.h > r.map.y + r.map.h + E)
    )
      problems.push(
        `${a.name} leaves the map box: ${JSON.stringify([a.x, a.y, a.w, a.h].map(Math.round))} map ${JSON.stringify([r.map.x, r.map.y, r.map.w, r.map.h].map(Math.round))}`,
      );
    if (a.x < -E || a.x + a.w > r.vw + E)
      problems.push(`${a.name} clipped horizontally by the viewport`);
    if (a.inSheet && (a.y < -E || a.y + a.h > r.vh + E))
      problems.push(`${a.name} (in the sheet) leaves the viewport vertically`);
    for (let j = i + 1; j < leaf.length; j++) {
      const b = leaf[j];
      // tally-toggle is the control inside the tally card
      if (a.name.startsWith('tally') && b.name.startsWith('tally')) continue;
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > E && oy > E)
        problems.push(`${a.name} overlaps ${b.name} by ${Math.round(ox)}x${Math.round(oy)}`);
    }
  }
  // Per-control reachability is asserted at every height, short landscape included.
  problems.push(...r.covered.map((c) => `hit-test: ${c}`));
  if (r.hScroll) problems.push('horizontal page scroll');
  expect(
    names.includes('field-attention') ||
      names.includes('tools-toggle') ||
      names.some((n: string) => n.startsWith('sheet-tools:')),
    `${label}: expected the attention toggle or the Tools disclosure; got ${names.join(',')}`,
  ).toBe(true);
  expect(problems, `${label}\n${problems.join('\n')}`).toEqual([]);
}

for (const vp of VIEWPORTS) {
  test.describe(`map overlays @ ${vp.name}`, () => {
    for (const view of ['globe', 'flat'] as const) {
      test(`${view}: default, attention expanded, tally collapsed`, async ({ browser }) => {
        test.setTimeout(90_000); // globe + WebGL under parallel load
        const ctx = await browser.newContext({
          viewport: { width: vp.w, height: vp.h },
          deviceScaleFactor: vp.dpr,
          hasTouch: vp.w < 900,
        });
        const page = await ctx.newPage();
        await openMap(page, view);

        // the map pane's width (not the window's) picks compact chrome, so let the first
        // measurement land before deciding which layout is under test
        await page.waitForFunction(
          () =>
            !!(document.querySelector('[data-tour="map"]') as HTMLElement | null)?.dataset.mapFree,
        );
        await page.waitForTimeout(400);
        assertLayout(await collect(page), `${vp.name}/${view}/default`);

        // Compact chrome (phones, short landscape): secondary controls sit behind one labelled
        // disclosure. Open it with a real click, read it, close it, reopen it: state is kept.
        const compactChrome = await page.getByTestId('map-tools-toggle').isVisible();
        if (compactChrome) {
          await expect(page.getByTestId('field-attention-toggle')).toHaveCount(0);
          await openMapTools(page);
          await settle(page);
          assertLayout(await collect(page), `${vp.name}/${view}/tools-open`);
        }

        // real (non-forced) click: fails if anything covers the toggle
        await page.getByTestId('field-attention-toggle').click();
        await expect(page.getByTestId('attention-filters')).toBeVisible();
        await settle(page);
        const expanded = await collect(page);
        assertLayout(expanded, `${vp.name}/${view}/attention-expanded`);

        const hide = page.getByRole('button', { name: 'Hide field tally' });
        if (await hide.isVisible()) {
          await hide.click();
          await expect(page.getByRole('button', { name: 'Show field tally' })).toBeVisible();
          await settle(page);
          assertLayout(await collect(page), `${vp.name}/${view}/tally-collapsed`);
        }

        if (compactChrome) {
          await page.keyboard.press('Escape');
          await expect(page.locator('#map-tools-panel')).toHaveCount(0);
          await expect(page.getByTestId('map-tools-toggle')).toBeFocused();
          await expect(page.getByTestId('map-tools-toggle')).toHaveAttribute(
            'aria-expanded',
            'false',
          );
          await openMapTools(page);
          await settle(page);
          await expect(page.getByTestId('field-attention-toggle')).toHaveAttribute(
            'aria-pressed',
            'true',
          );
          assertLayout(await collect(page), `${vp.name}/${view}/tools-reopened`);
        }
        await ctx.close();
      });
    }
  });
}

test.describe('map overlay frame contract', () => {
  test.setTimeout(60_000);
  test('publishes its bottom edge for the HUD and follows expansion', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await openMap(page, 'globe');
    const before = await collect(page);
    const px = (s: string) => parseFloat(s);
    expect(px(before.overlayBottomVar)).toBeGreaterThan(0);
    expect(Math.abs(px(before.overlayBottomVar) - before.frameBottom!)).toBeLessThanOrEqual(1);
    await page.getByTestId('field-attention-toggle').click();
    await page.waitForTimeout(300);
    const after = await collect(page);
    expect(px(after.overlayBottomVar)).toBeGreaterThan(px(before.overlayBottomVar));
    expect(Math.abs(px(after.overlayBottomVar) - after.frameBottom!)).toBeLessThanOrEqual(1);
    await ctx.close();
  });

  test('keyboard: every overlay control is reachable, focus lands fully on screen and uncovered', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await ctx.newPage();
    await openMap(page, 'flat');
    await openMapTools(page);
    await settle(page);
    await page.getByTestId('field-attention-toggle').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('field-attention-toggle')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // restart the Tab sequence from the first overlay control so the whole frame is walked
    await page.getByRole('button', { name: 'Flat map' }).first().focus();
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(350); // let focus-driven scrolling settle (global smooth scroll)
      const info = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null;
        // frame controls only; Leaflet markers and the sheet are other slices
        if (
          !a ||
          (!a.closest(
            '[data-map-toolbar], [data-testid="field-attention-toggle"], [data-testid="attention-filters"], #map-tools-panel',
          ) &&
            !a.matches(
              '[aria-label="Flat map"], [aria-label="Globe view"], [aria-label$="field tally"], [aria-label="Dismiss ticker"], [data-testid="map-tools-toggle"]',
            ))
        )
          return null;
        const r = a.getBoundingClientRect();
        const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return {
          label: a.getAttribute('aria-label') || a.textContent?.trim().slice(0, 24) || a.tagName,
          inView:
            r.x >= -0.5 &&
            r.y >= -0.5 &&
            r.right <= innerWidth + 0.5 &&
            r.bottom <= innerHeight + 0.5,
          uncovered: !!t && (t === a || a.contains(t)),
          by: t
            ? `${t.tagName} ${(t.getAttribute('aria-label') || t.className || '').toString().slice(0, 60)} @${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`
            : 'nothing',
        };
      });
      if (!info) continue;
      seen.add(info.label);
      expect.soft(info.inView, `${info.label} focus rect inside viewport`).toBe(true);
      expect.soft(info.uncovered, `${info.label} focus target uncovered by ${info.by}`).toBe(true);
    }
    expect([...seen].join('|')).toMatch(/Graffiti camera/);
    await ctx.close();
  });

  test('route transition: leaving and returning to /map re-publishes the frame offset', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await openMap(page, 'globe');
    // real client-side route transitions, not full reloads
    await page
      .getByRole('link', { name: /Home console/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/$/);
    await page.getByRole('link', { name: 'Field map' }).first().click();
    await expect(page).toHaveURL(/\/map/);
    await expect(page.getByTestId('field-attention-toggle')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(600);
    assertLayout(await collect(page), 'after route transition');
    await ctx.close();
  });
});

// ContextualNudge (shared, fixed, bottom-centre) is visible on first visit. With it shown, none of
// the map's controls may sit under it and it must clear the bottom nav. Asserted by hit-testing
// every control the probe finds, in both views, on phones and in short landscape.
const NUDGE_VIEWPORTS: [number, number][] = [
  [320, 640],
  [360, 640],
  [390, 844],
  [430, 932],
  [844, 390],
];
for (const [w, h] of NUDGE_VIEWPORTS) {
  for (const view of ['flat', 'globe'] as const) {
    test(`nudge shown does not cover map controls @ ${w}x${h} ${view}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width: w, height: h });
      await openMapWithMock(page, { view, nudge: 'shown' });
      if (h < 500) {
        // short landscape: the nudge is intentionally not shown on /map (no room); the map's own
        // Report action covers the same step and must be usable.
        await page.waitForTimeout(2500);
        await expect(page.locator('[class*="z-[70]"]').filter({ hasText: /execute/i })).toHaveCount(
          0,
        );
        const p = await probeMap(page);
        expect(p.items.filter((i) => i.hit !== 'ok' && i.hit !== 'inert')).toEqual([]);
        expect(p.items.some((i) => i.name === 'toolbar-report')).toBe(true);
        return;
      }
      const nudge = page
        .locator('[class*="z-[70]"]')
        .filter({ hasText: /execute/i })
        .first();
      await expect(nudge).toBeVisible();
      // the sheet follows the nudge's published clearance and the HUD follows the sheet
      await page.waitForTimeout(700);
      const probe = await probeMap(page);
      const nb = (await nudge.boundingBox())!;
      if (probe.nav) {
        expect(nb.y + nb.height, 'nudge clears the bottom nav').toBeLessThanOrEqual(
          probe.nav.y + 0.5,
        );
      }
      const covered = probe.items.filter((i) => i.hit !== 'ok' && i.hit !== 'inert');
      expect(covered, 'controls covered by the nudge').toEqual([]);
      expect(probe.hScroll).toBe(false);
    });
  }
}
