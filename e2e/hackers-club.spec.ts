import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockBase44 } from './fixtures/mockBase44';

for (const viewport of [
  { width: 360, height: 800 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
]) {
  test(`Hackers Club anonymous creative journey at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/api/app-logs/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
    const errors: string[] = [];
    const writes: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (
        /\/entities\//.test(request.url()) &&
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())
      )
        writes.push(request.url());
    });
    await page.goto('/hackers-club');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hackers Club.');
    await page.getByLabel('Your poster message').fill('<script>alert(1)</script> CITY FOR PEOPLE');
    await expect(page.getByTestId('club-poster-message')).toHaveText(
      '<script>alert(1)</script> CITY FOR PEOPLE',
    );
    await expect(page.getByTestId('club-poster').locator('script')).toHaveCount(0);
    await page.getByLabel('Warm cream').check();
    await page.getByRole('button', { name: 'Reset poster' }).click();
    await expect(page.getByLabel('Your poster message')).toHaveValue('MORE SPACE\nFOR PEOPLE.');
    await page.getByRole('button', { name: /Make space for art/ }).click();
    await expect(page.getByRole('link', { name: 'Explore the field atlas' })).toHaveAttribute(
      'href',
      '/map',
    );
    await page.getByRole('button', { name: /Build. Test. Protect./ }).click();
    await expect(
      page.getByText('This page grants no testing authorisation', { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Discuss a collaboration' })).toHaveAttribute(
      'href',
      '/contact',
    );
    await page.getByRole('button', { name: /Remix the message/ }).click();
    await page.getByLabel('Your poster message').fill('W'.repeat(120));
    const geometry = await page.getByTestId('club-poster-message').evaluate((el) => {
      const outer = el.parentElement!.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      return {
        contained:
          rect.top >= outer.top &&
          rect.bottom <= outer.bottom &&
          rect.left >= outer.left &&
          rect.right <= outer.right,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(geometry).toEqual({ contained: true, overflow: false });
    await page.reload();
    await expect(page.getByLabel('Your poster message')).toHaveValue('MORE SPACE\nFOR PEOPLE.');
    expect(errors).toEqual([]);
    expect(writes).toEqual([]);
  });
}

test('Hackers Club main content is accessible and brief controls work by keyboard', async ({
  page,
}) => {
  await mockBase44(page, { user: null, locations: {} });
  await page.goto('/hackers-club');
  const control = page.getByRole('button', { name: /Make space for art/ });
  await control.focus();
  await page.keyboard.press('Enter');
  await expect(control).toHaveAttribute('aria-pressed', 'true');
  const results = await new AxeBuilder({ page }).include('main').analyze();
  expect(results.violations).toEqual([]);
});

for (const viewport of [
  { width: 360, height: 800 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
]) {
  test(`Hackers Club poster header labels stay separate and contained at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/hackers-club');
    const labels = page.getByTestId('club-poster-header').locator('span');
    await expect(labels).toHaveCount(2);
    const poster = (await page.getByTestId('club-poster').boundingBox())!;
    const [a, b] = await Promise.all([0, 1].map((i) => labels.nth(i).boundingBox()));
    for (const box of [a!, b!]) {
      expect(box.x).toBeGreaterThanOrEqual(poster.x);
      expect(box.x + box.width).toBeLessThanOrEqual(poster.x + poster.width);
    }
    // Either on one row with a readable gap, or wrapped onto separate rows. Never touching.
    const sameRow = a!.y < b!.y + b!.height && b!.y < a!.y + a!.height;
    if (sameRow) expect(b!.x - (a!.x + a!.width)).toBeGreaterThanOrEqual(8);
    else expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height);
    // Neither label is clipped by its own box.
    const clipped = await labels.evaluateAll((els) =>
      els.some((el) => el.scrollWidth > el.clientWidth + 1),
    );
    expect(clipped).toBe(false);
  });
}
