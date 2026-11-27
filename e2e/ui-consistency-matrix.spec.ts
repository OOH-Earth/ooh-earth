import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { mockBase44 } from './fixtures/mockBase44';

// Measurement matrix for the consistency pass (docs/design/OOH-UI-UX-REFERENCE.md section 9).
// For each route x viewport it records, from the real DOM: horizontal overflow, visible interactive
// controls under 24px (WCAG 2.5.8) and under 44px (project target), visible text under 12px, and the
// number of text elements whose computed contrast against their nearest opaque ancestor is below
// 4.5:1 (approximate: elements over images/gradients are skipped, so it is a lower bound).
// Only overflow is asserted. Run the same spec against two builds (E2E_MATRIX_OUT=file.json) to get
// before/after numbers. E2E_MATRIX_SHOTS=dir also saves a screenshot per state.

const ROUTES = ['/', '/map', '/report', '/media-corps', '/plans', '/support'];
const VIEWPORTS: [number, number][] = [
  [320, 640],
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [820, 1180],
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [667, 375],
  [844, 390],
];
const OUT = process.env.E2E_MATRIX_OUT;
const SHOTS = process.env.E2E_MATRIX_SHOTS;
const SHOT_VIEWPORTS = new Set(['390x844', '320x640', '1280x720']);
const results: Record<string, unknown> = {};
void results;

for (const route of ROUTES) {
  for (const [w, h] of VIEWPORTS) {
    test(`matrix ${route} @ ${w}x${h}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: w, height: h });
      await page.addInitScript(() => localStorage.setItem('ooh_nudge_map_report', '1'));
      await mockBase44(page, { user: null });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(route === '/map' ? 4500 : 2500);
      const m = await page.evaluate(() => {
        const vis = (e: Element) => {
          const r = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          return (
            r.width > 0 &&
            r.height > 0 &&
            s.visibility !== 'hidden' &&
            s.display !== 'none' &&
            s.opacity !== '0'
          );
        };
        const lum = (c: number[]) => {
          const f = (v: number) =>
            (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
        };
        const parse = (s: string) => {
          const m = s.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const p = m[1].split(/[ ,/]+/).map(Number);
          return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
        };
        const bgOf = (el: Element) => {
          let n: Element | null = el;
          while (n) {
            const s = getComputedStyle(n);
            if (s.backgroundImage !== 'none') return null; // image/gradient: unknown
            const p = parse(s.backgroundColor);
            if (p && p.a >= 0.99) return p.c;
            n = n.parentElement;
          }
          return [0, 0, 0];
        };
        const controls = [
          ...document.querySelectorAll(
            'button, a[href], input:not([type=hidden]), select, textarea, [role=button]',
          ),
        ].filter(vis);
        const small24: string[] = [];
        let small44 = 0;
        for (const e of controls) {
          const r = e.getBoundingClientRect();
          if (r.width < 24 || r.height < 24)
            small24.push(
              `${e.tagName}:${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24)}`,
            );
          if (r.width < 44 || r.height < 44) small44++;
        }
        const sizes: Record<string, number> = {};
        let smallText = 0;
        let lowContrast = 0;
        let measured = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const seen = new Set<Element>();
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const el = n.parentElement;
          if (!el || seen.has(el) || !(n.textContent || '').trim() || !vis(el)) continue;
          seen.add(el);
          const cs = getComputedStyle(el);
          const px = parseFloat(cs.fontSize);
          if (px < 12) {
            smallText++;
            sizes[String(px)] = (sizes[String(px)] || 0) + 1;
          }
          const fg = parse(cs.color);
          const bg = bgOf(el);
          if (fg && bg) {
            measured++;
            const a = fg.a;
            const mixed = fg.c.map((v, i) => a * v + (1 - a) * bg[i]);
            const [hi, lo] = [lum(mixed), lum(bg)].sort((x, y) => y - x);
            const ratio = (hi + 0.05) / (lo + 0.05);
            const large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
            if (ratio < (large ? 3 : 4.5)) lowContrast++;
          }
        }
        return {
          hScroll: document.documentElement.scrollWidth > innerWidth + 1,
          controls: controls.length,
          small24: small24.length,
          small24Names: small24.slice(0, 5),
          small44,
          smallText,
          smallTextSizes: sizes,
          textMeasured: measured,
          lowContrast,
        };
      });
      results[`${route}@${w}x${h}`] = m;
      if (OUT) {
        // one file per state: Playwright workers do not share memory
        fs.mkdirSync(`${OUT}.d`, { recursive: true });
        fs.writeFileSync(
          path.join(`${OUT}.d`, `${route.replace(/\W/g, '_')}@${w}x${h}.json`),
          JSON.stringify(m),
        );
      }
      if (SHOTS && SHOT_VIEWPORTS.has(`${w}x${h}`)) {
        fs.mkdirSync(SHOTS, { recursive: true });
        await page.screenshot({
          path: path.join(SHOTS, `${route === '/' ? 'home' : route.slice(1)}-${w}x${h}.png`),
        });
      }
      expect(m.hScroll, `${route} @ ${w}x${h}: no horizontal page scroll`).toBe(false);
    });
  }
}
