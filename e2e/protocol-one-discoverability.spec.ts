import { test, expect } from '@playwright/test';

// public/protocol-one.html (see protocol-one-page.spec.ts) was built with
// its own Open Graph / Twitter Card metadata specifically to be shared and
// found -- but it had zero inbound links from the actual product and was
// missing from sitemap.xml, so nobody browsing the live app (or a search
// crawler) could ever discover it. This is a regression test for that fix:
// the page must be reachable both from the site chrome and from the
// sitemap, not just by someone who already has the raw URL.

test.describe('Protocol One — discoverable from the real app', () => {
  test('the site footer links to /protocol-one.html', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('footer a[href="/protocol-one.html"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/Protocol One/i);
  });

  test('the footer link actually resolves to the live page', async ({ page, request }) => {
    await page.goto('/');
    const href = await page.locator('footer a[href="/protocol-one.html"]').getAttribute('href');
    expect(href).toBe('/protocol-one.html');

    const res = await request.get(href!);
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).toContain('<title>Protocol One — OOH Earth</title>');
  });

  test('sitemap.xml lists protocol-one.html', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/sitemap.xml`);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('<loc>https://oohearth.app/protocol-one.html</loc>');
  });
});
