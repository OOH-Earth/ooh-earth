import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Adversarial / failure-injection coverage for the Ad Scanner multi-photo
// flow (src/pages/AdScanLab.jsx), split out from e2e/ad-scanner.spec.ts's
// happy-path coverage. These exist to try to break catalogLocation()'s
// atomicity guarantees and the cover/scan contract before a real user does
// -- see the "OOH EARTH — PRODUCTION HARD TEST" pass this file was written
// for. Assert: no false success, no silent data loss, no uncontrolled
// duplicate Location records.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG1 = path.join(__dirname, 'fixtures', 'test-image.png');
const IMG2 = path.join(__dirname, 'fixtures', 'test-image-2.png');

async function openViaMenu(page: import('@playwright/test').Page) {
  await page.route('**/entities/LabPrototype*', (route) => {
    const q = new URL(route.request().url()).searchParams.get('q') || '';
    if (q.includes('/lab/scanner')) {
      return route.fulfill({
        json: [{ id: 'lab-scanner', path: '/lab/scanner', access: 'public' }],
      });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Open menu/i }).click();
  const dialog = page.locator('[role="dialog"][aria-label="Navigation menu"]:visible');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('link', { name: 'Ad Scanner' }).click();
  await expect(page).toHaveURL(/\/lab\/scanner/);
  await expect(page.getByRole('heading', { name: /Ad Scanner/i })).toBeVisible();
}

async function uploadInput(page: import('@playwright/test').Page) {
  return page.getByRole('button', { name: 'Upload images' }).locator('input[type="file"]');
}

async function setLatLng(page: import('@playwright/test').Page, lat: string, lng: string) {
  await page.getByText('Enter coordinates manually').click();
  await page.getByPlaceholder('Latitude').fill(lat);
  await page.getByPlaceholder('Longitude').fill(lng);
}

test.describe('Ad Scanner — cover changes after removal', () => {
  test('removing the original cover and scanning sends the NEW cover, not the old one', async ({
    page,
  }) => {
    let coverUrlSent: string | null = null;
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });
    await page.route('**/functions/scanAd', (route) => {
      coverUrlSent = route.request().postDataJSON()?.file_url ?? null;
      return route.fulfill({
        json: { detection: { is_advertising: false, confidence: 0.2 } },
      });
    });

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1, IMG2]);
    const originalCoverSrc = await page
      .locator('div:has(> span:text-is("Cover")) img')
      .getAttribute('src');

    // Remove the original cover (index 0) -- the former second photo (IMG2)
    // must become the new cover.
    await page.getByRole('button', { name: 'Remove photo' }).first().click();
    const newCoverSrc = await page
      .locator('div:has(> span:text-is("Cover")) img')
      .getAttribute('src');
    expect(newCoverSrc).not.toBe(originalCoverSrc);

    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect.poll(() => coverUrlSent).not.toBeNull();
    expect(coverUrlSent).toBe(newCoverSrc);
  });
});

test.describe('Ad Scanner — catalog atomicity under partial/total extra-photo failure', () => {
  test('3 extras, 2 fail: exactly 1 Location, correct failure count, no duplicate rows for the failures', async ({
    page,
  }) => {
    const locationPosts: string[] = [];
    const photoPosts: Record<string, unknown>[] = [];
    await mockBase44(page, {
      user: { id: 'scout-4', role: 'user', access: 'member' },
      locations: {},
      locationPhotos: [],
      locationPhotoFailuresRemaining: 2,
    });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            is_advertising: true,
            brand_name: 'Shell',
            surface_type: 'billboard',
            industry_sector: 'fossil_fuel',
            confidence: 0.85,
          },
        },
      }),
    );
    page.on('request', (req) => {
      if (req.method() !== 'POST') return;
      if (req.url().includes('/entities/Location') && !req.url().includes('LocationPhoto')) {
        locationPosts.push(req.url());
      }
      if (req.url().includes('/entities/LocationPhoto')) {
        photoPosts.push(req.postDataJSON());
      }
    });

    await openViaMenu(page);
    // cover + 3 extras
    await (await uploadInput(page)).setInputFiles([IMG1, IMG2, IMG1, IMG2]);
    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('Shell');
    await setLatLng(page, '13.75', '100.50');
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();

    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible();
    await expect(page.getByTestId('photo-failure-notice')).toContainText(
      /2 photos failed to attach/i,
    );

    expect(locationPosts.length).toBe(1);
    await expect.poll(() => photoPosts.length).toBe(3);
  });

  test('all extras fail: Location still created and reported, all failures surfaced, no crash', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const locationPosts: string[] = [];
    await mockBase44(page, {
      user: { id: 'scout-5', role: 'user', access: 'member' },
      locations: {},
      locationPhotos: [],
      locationPhotoFailuresRemaining: 2,
    });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            is_advertising: true,
            brand_name: 'Shell',
            surface_type: 'billboard',
            industry_sector: 'fossil_fuel',
            confidence: 0.85,
          },
        },
      }),
    );
    page.on('request', (req) => {
      if (
        req.method() === 'POST' &&
        req.url().includes('/entities/Location') &&
        !req.url().includes('LocationPhoto')
      ) {
        locationPosts.push(req.url());
      }
    });

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1, IMG2, IMG1]); // cover + 2 extras, both fail
    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('Shell');
    await setLatLng(page, '13.75', '100.50');
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();

    // The Location record itself succeeded -- that's still true and still said.
    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible();
    await expect(page.getByTestId('photo-failure-notice')).toContainText(
      /2 photos failed to attach/i,
    );
    expect(locationPosts.length).toBe(1);

    expect(
      consoleErrors.filter((e) => /Uncaught|is not a function|is not defined/i.test(e)),
    ).toEqual([]);
  });
});

test.describe('Ad Scanner — double-submit / rapid re-click safety', () => {
  test('two near-simultaneous clicks on "Catalog to atlas" create exactly one Location', async ({
    page,
  }) => {
    const locationPosts: string[] = [];
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            is_advertising: true,
            brand_name: 'Shell',
            surface_type: 'billboard',
            industry_sector: 'fossil_fuel',
            confidence: 0.85,
          },
        },
      }),
    );
    // Delay the Location POST slightly so a same-tick second click has a
    // real window to race against the first request in flight, not just
    // against React's own re-render.
    await page.route('**/entities/Location', async (route) => {
      if (route.request().method() === 'POST') {
        locationPosts.push(route.request().url());
        await new Promise((r) => setTimeout(r, 150));
      }
      await route.fallback();
    });

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1]);
    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('Shell');
    await setLatLng(page, '13.75', '100.50');

    // Two native click events dispatched synchronously in the same task, not
    // two separate Playwright .click() calls (which each do their own
    // actionability waiting/retrying and can't dispatch truly
    // simultaneously) and not Playwright's built-in dblclick gesture (one
    // browser dblclick event, not two separate React onClick invocations).
    // This is the closest a script can get to "the button got clicked twice
    // before React had a chance to re-render it disabled."
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find((el) =>
        /Catalog to atlas/i.test(el.textContent || ''),
      );
      if (!button) throw new Error('Catalog to atlas button not found');
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible();
    expect(locationPosts.length).toBe(1);
  });
});

test.describe('Ad Scanner — malformed / sparse AI responses', () => {
  test('an empty detection object does not crash and does not auto-catalog', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await mockBase44(page, { user: null });
    await page.route('**/functions/scanAd', (route) => route.fulfill({ json: {} }));

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1]);
    await page.getByRole('button', { name: /Run detection/i }).click();

    // No ad detected branch renders; no review form, no crash.
    await expect(page.getByText('No ad', { exact: true })).toBeVisible();
    await expect(page.getByText('Cataloged to atlas')).toHaveCount(0);
    expect(
      consoleErrors.filter((e) => /Uncaught|is not a function|is not defined/i.test(e)),
    ).toEqual([]);
  });

  test('a sparse is_advertising:true response with missing fields renders an editable, blank-safe review', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({ json: { detection: { is_advertising: true } } }),
    );

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1]);
    await page.getByRole('button', { name: /Run detection/i }).click();

    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('');
    await expect(page.getByLabel(/Harm tags/i)).toHaveValue('');
    // User can still fill it in and catalog successfully -- sparse AI output
    // doesn't brick the form.
    await page.getByLabel('Brand', { exact: true }).fill('Manual Brand');
    await setLatLng(page, '13.75', '100.50');
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();
    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible();
  });
});

test.describe('Ad Scanner — scanAd failure surface', () => {
  test('a 500 from scanAd surfaces "Scan failed" and permits retry without losing uploaded photos', async ({
    page,
  }) => {
    await mockBase44(page, { user: null });
    let attempt = 0;
    await page.route('**/functions/scanAd', async (route) => {
      attempt += 1;
      if (attempt === 1) return route.fulfill({ status: 500, json: { error: 'boom' } });
      return route.fulfill({ json: { detection: { is_advertising: false, confidence: 0.1 } } });
    });

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1, IMG2]);
    const thumbs = page.locator('div:has(> button[aria-label="Remove photo"])');
    // Wait for both uploads to actually finish rendering before recording
    // the "before" count -- setInputFiles() only queues the async upload,
    // it doesn't wait for it.
    await expect(thumbs).toHaveCount(2);
    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByText(/Scan failed/i)).toBeVisible();

    // Failed scan returns the user to the capture step with photos intact
    // (no silent data loss of already-uploaded images).
    await expect(thumbs).toHaveCount(2);

    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByText('No ad', { exact: true })).toBeVisible();
  });
});
