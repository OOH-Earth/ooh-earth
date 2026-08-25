import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, ADMIN_USER } from './fixtures/mockBase44';

// OOH Earth is a pure client-rendered SPA with no SSR/prerender plugin.
// src/lib/seoContext.jsx already applies correct per-route metadata to
// document.head after React mounts -- real browsers and JS-executing
// crawlers see it fine. Non-JS social-preview bots (Facebook, Twitter/X,
// Slack, iMessage, ...) only ever see the raw HTML response, which used to
// be identical on every route. scripts/prerender-meta.mjs now bakes real
// per-route metadata into a static dist/<route>/index.html at build time.
//
// This file tests both halves separately: the client-hydrated behavior
// (real browser, via `page`) and the raw-HTTP behavior a non-JS crawler
// would see (no JS execution, via Playwright's `request` fixture).

test.describe('Client-hydrated metadata (real browser, JS-executing crawlers)', () => {
  test('document.title and og:title update per route after hydration', async ({ page }) => {
    // Lab prototypes are dynamically access-controlled. NFT Creator is a
    // restricted prototype, so exercise its metadata as an authenticated
    // visitor rather than treating the login redirect as a metadata failure.
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    page.on('pageerror', filterCrashes);

    await page.goto('/map');
    await expect(page).toHaveTitle('Field Atlas — OOH Earth');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Field Atlas — OOH Earth',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/map$/);

    await page.goto('/report');
    await expect(page).toHaveTitle('Field Report — OOH Earth');

    await page.goto('/lab/nft');
    await expect(page).toHaveTitle('NFT Creator — OOH Earth Lab');
  });
});

test.describe('Raw-HTTP metadata (no JS execution — what a social-preview bot sees)', () => {
  test('a static-file host serving dist/<route>/index.html returns the real per-route title', async ({
    request,
    baseURL,
  }) => {
    // vite preview (this suite's webServer) only resolves the generated
    // static file for the trailing-slash / explicit-file form, not the
    // bare `/map` path -- documented, not a bug in the generator. Whether
    // OOH Earth's actual production host resolves the bare clean-URL form
    // to the same file is unverified here; see
    // docs/BASE44_ARCHITECTURE_AND_ACCESS.md.
    const res = await request.get(`${baseURL}/map/`);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('<title>Field Atlas — OOH Earth</title>');
    expect(body).toContain('property="og:title" content="Field Atlas — OOH Earth"');
  });

  test('the root route carries the canonical site title, not a stale one', async ({
    request,
    baseURL,
  }) => {
    const res = await request.get(`${baseURL}/`);
    const body = await res.text();
    expect(body).toContain('<title>OOH Earth — Street Art &amp; Adbusting Maps</title>');
  });
});
