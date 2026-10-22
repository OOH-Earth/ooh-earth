import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Rendering-level guard only: these phrases asserted membership, partnership or
// alignment that nothing in the product evidences. The mission (adbusting maps)
// is unchanged.
const FORBIDDEN = [
  /union of ad-industry veterans/i,
  /union-made by veterans/i,
  /aligned to (the )?UN SDGs/i,
  /Web7 · sovereign/i,
];

test.describe('unsupported public claims stay removed', () => {
  for (const route of ['/', '/about', '/contact', '/report']) {
    test(`${route} has none of the retired claims`, async ({ page }) => {
      await mockBase44(page, { user: null, locations: {} });
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const text = await page.evaluate(() => document.body.innerText);
      for (const pattern of FORBIDDEN) expect(text).not.toMatch(pattern);
    });
  }
});
