import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER, filterCrashes } from './fixtures/mockBase44';

// A present-but-rejected access_token used to cause an unbounded,
// self-nesting redirect loop: /operative -> /login?from_url=... ->
// /login?from_url=<encoded previous URL> -> ... (18+ redirects observed in
// real browser navigation history before this was fixed). Root cause: on a
// 401/403 from the auth check, the rejected token was never cleared from
// storage, so every subsequent full page load -- including /login itself,
// which is rendered behind the same global auth gate as every other route
// -- retried the same dead credential, failed again, and redirected again
// with an increasingly nested ?from_url. Fixed in src/lib/AuthContext.jsx
// by clearing the token (src/lib/app-params.js's clearAccessToken(), the
// same storage keys the existing ?clear_access_token=true convention
// already clears) at the point a 401/403 is caught.

test.describe('Auth — a rejected token does not cause a redirect loop', () => {
  test('invalid token on a protected route redirects to /login exactly once and stays stable', async ({
    page,
  }) => {
    // db.user is unset -> GET .../entities/User/me returns 401, so this
    // access_token is present but rejected -- the exact failure mode.
    await mockBase44(page, { user: null, locations: {} });
    page.on('pageerror', filterCrashes);

    const navigations: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) navigations.push(frame.url());
    });

    await page.goto('/operative?access_token=mock-admin-token');
    // Give any (would-be) redirect chain time to run its course rather than
    // asserting immediately after the first navigation settles.
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/login(\?|$)/);

    // No accumulation: a real ?from_url must never contain a second,
    // percent-encoded ?from_url nested inside it.
    expect(finalUrl).not.toMatch(/from_url.*from_url/);

    // The loop's signature was runaway URL growth. A single clean redirect
    // produces a short URL; the observed bug produced URLs several KB long.
    expect(finalUrl.length).toBeLessThan(200);

    // Stable: waiting longer must not change the URL further.
    await page.waitForTimeout(1500);
    expect(page.url()).toBe(finalUrl);

    // The meaningful "no loop" property isn't a raw navigation count (the
    // SPA's history mechanics can legitimately re-fire framenavigated for
    // an unchanged URL) -- it's that every /login URL reached is IDENTICAL,
    // never a longer, more deeply nested one than the last.
    const loginHits = navigations.filter((u) => new URL(u).pathname === '/login');
    expect(loginHits.length).toBeGreaterThan(0);
    expect(new Set(loginHits).size).toBe(1);
  });

  test('no token — /login (direct) is reachable and stable, not part of the auth gate', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    page.on('pageerror', filterCrashes);

    await page.goto('/operative');
    await page.waitForTimeout(1500);

    // No token means no auth_required error -- OperativeProfile renders its
    // own "Authentication Required" state in place, no redirect at all.
    expect(page.url()).toContain('/operative');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/operative');
  });

  test("a valid session reaches the protected route's real content, not a redirect", async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: {} });
    page.on('pageerror', filterCrashes);

    await page.goto('/operative?access_token=mock-admin-token');
    await page.waitForTimeout(1500);

    expect(page.url()).toContain('/operative');
    expect(page.url()).not.toContain('/login');
  });
});
