import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// Ad Scanner (/lab/scanner, src/pages/AdScanLab.jsx) — reached from the
// "Open menu" -> "Ad Scanner" shortcut (see NavMenu.jsx SITEMAP). Covers the
// gap between "implemented" and "verified": multi-photo capture/upload,
// AI detection via the existing scanAd function, an editable review step
// before anything is written (the AI result is a draft, never auto-filed),
// and cataloging cover + gallery photos correctly.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMG1 = path.join(__dirname, 'fixtures', 'test-image.png');
const IMG2 = path.join(__dirname, 'fixtures', 'test-image-2.png');

// File-level (Playwright requires launchOptions overrides at the top level,
// not inside a describe block) -- only the camera describe below actually
// exercises getUserMedia, but a fake media device is inert for every other
// test in this file.
test.use({
  permissions: ['camera'],
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

function trackConsoleErrors(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

async function openViaMenu(page: import('@playwright/test').Page) {
  // /lab/* routes are gated by LabAccessRoute, which reads the LabPrototype
  // record for the current path and defaults to "restricted" (-> redirects
  // anonymous visitors to /login) when none is found. mockBase44 has no
  // LabPrototype fixture, so without this the shortcut would silently bounce
  // to a login redirect instead of ever reaching AdScanLab -- Ad Scanner is
  // a public "live" surface in production, so mirror that here.
  await page.route('**/entities/LabPrototype*', (route) => {
    // NavMenu's own useLabNavItems() also calls LabPrototype.list() (no path
    // filter) to build the "Lab" group's menu items -- only answer the
    // access-check query (?q includes this path) with our record, so we
    // don't inject a bogus unrelated nav item into that unrelated list.
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

test.describe('Ad Scanner — menu shortcut wiring', () => {
  test('the "Ad Scanner" menu item opens the real /lab/scanner multi-photo flow', async ({
    page,
  }) => {
    await mockBase44(page, { user: null });
    await openViaMenu(page);
    // Proves this is the changed component, not a stale/duplicate page: the
    // multi-photo upload input and live camera viewfinder are both present.
    await expect(await uploadInput(page)).toHaveCount(1);
    await expect(await uploadInput(page)).toHaveAttribute('multiple', '');
    await expect(page.getByRole('button', { name: 'Capture' })).toBeVisible();
  });
});

test.describe('Ad Scanner — multi-photo upload', () => {
  test('multiple file selection, cover badge, remove, cover reassignment, no duplicate URLs', async ({
    page,
  }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, { user: null });
    await openViaMenu(page);

    // 1-3: upload 3 images in a single selection; all appear.
    await (await uploadInput(page)).setInputFiles([IMG1, IMG2, IMG1]);
    const thumbs = page.locator('div:has(> button[aria-label="Remove photo"])');
    await expect(thumbs).toHaveCount(3);

    // 4: first is marked Cover.
    await expect(page.getByText('Cover', { exact: true })).toHaveCount(1);
    const coverImg = () => page.locator('div:has(> span:text-is("Cover")) img');
    const firstCoverSrc = await coverImg().getAttribute('src');

    // 9: distinct URLs per upload (no accidental de-dup / collapse to one URL).
    const srcs = await thumbs
      .locator('img')
      .evaluateAll((els) => els.map((el) => (el as HTMLImageElement).src));
    expect(new Set(srcs).size).toBe(3);

    await page.screenshot({
      path: `e2e/screenshots/${testInfo.project.name}/adscanner-multi-upload.png`,
    });

    // 7: remove a non-cover photo -> count drops, cover unchanged.
    await page.getByRole('button', { name: 'Remove photo' }).nth(1).click();
    await expect(thumbs).toHaveCount(2);
    expect(await coverImg().getAttribute('src')).toBe(firstCoverSrc);

    // 8: remove the cover -> the next photo becomes cover.
    const secondSrcBefore = await thumbs.nth(1).locator('img').getAttribute('src');
    await page.getByRole('button', { name: 'Remove photo' }).first().click();
    await expect(thumbs).toHaveCount(1);
    await expect(page.getByText('Cover', { exact: true })).toHaveCount(1);
    expect(await coverImg().getAttribute('src')).toBe(secondSrcBefore);

    // 10: no stale removed photo remains.
    expect(await thumbs.locator('img').getAttribute('src')).not.toBe(firstCoverSrc);

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('adding beyond the 9-photo cap is handled gracefully', async ({ page }) => {
    await mockBase44(page, { user: null });
    await openViaMenu(page);

    await (await uploadInput(page)).setInputFiles(Array(10).fill(IMG1));

    const thumbs = page.locator('div:has(> button[aria-label="Remove photo"])');
    await expect(thumbs).toHaveCount(9);
    // Capture/upload controls disappear once the cap is hit -- no way to add a 10th.
    await expect(page.getByRole('button', { name: 'Capture' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Upload images' })).toHaveCount(0);
  });
});

test.describe('Ad Scanner — camera multi-capture', () => {
  test('camera stays available across repeated shutter presses and combines with uploads under one cap', async ({
    page,
  }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    await mockBase44(page, { user: null });
    await openViaMenu(page);

    // 3 uploaded first.
    await (await uploadInput(page)).setInputFiles([IMG1, IMG2, IMG1]);
    const thumbs = page.locator('div:has(> button[aria-label="Remove photo"])');
    await expect(thumbs).toHaveCount(3);

    const shutter = page.getByRole('button', { name: 'Capture' });
    await expect(shutter).toBeVisible();

    // +4 captured -> 7 total, camera remains mounted/usable between shots.
    for (let i = 0; i < 4; i++) {
      await expect(shutter).toBeEnabled({ timeout: 10_000 });
      await shutter.click();
      await expect(thumbs).toHaveCount(4 + i);
    }

    // Cover is still the first *uploaded* photo, untouched by captures.
    await expect(page.getByText('Cover', { exact: true })).toHaveCount(1);

    await page.screenshot({
      path: `e2e/screenshots/${testInfo.project.name}/adscanner-camera-multi-capture.png`,
    });

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });
});

test.describe('Ad Scanner — Run detection + AI review', () => {
  test('scans the cover photo, shows a loading state, and autofills editable fields without auto-cataloging', async ({
    page,
  }) => {
    let scanAdCalls = 0;
    let coverUrlSent: string | null = null;
    const locationPosts: string[] = [];
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/scanAd', async (route) => {
      scanAdCalls += 1;
      coverUrlSent = route.request().postDataJSON()?.file_url ?? null;
      await new Promise((r) => setTimeout(r, 250)); // keep the loading state observable
      await route.fulfill({
        json: {
          detection: {
            is_advertising: true,
            brand_name: 'Shell',
            campaign_name: 'Cleaner Energy',
            ad_agency: 'Ogilvy',
            parent_corp: 'Shell plc',
            ooh_operator: 'JCDecaux',
            surface_type: 'billboard',
            industry_sector: 'fossil_fuel',
            harm_tags: ['greenwashing'],
            description: 'Large roadside billboard with Shell branding.',
            visible_text: 'GO CLEANER. GO SHELL.',
            confidence: 0.92,
          },
        },
      });
    });
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/entities/Location')) {
        locationPosts.push(req.url());
      }
    });

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1]);

    const runDetection = page.getByRole('button', { name: /Run detection/i });
    await runDetection.click();

    // Loading state is visible while the request is in flight.
    await expect(page.getByText(/Analyzing image/i)).toBeVisible();

    // 7: scan runs against the cover image.
    await expect.poll(() => scanAdCalls).toBe(1);
    expect(coverUrlSent).toContain('mock-upload-1.jpg');

    // Editable fields populate from the AI result.
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('Shell');
    await expect(page.getByLabel('Campaign', { exact: true })).toHaveValue('Cleaner Energy');
    await expect(page.getByLabel('Agency', { exact: true })).toHaveValue('Ogilvy');
    await expect(page.getByLabel('Parent Corp', { exact: true })).toHaveValue('Shell plc');
    await expect(page.getByLabel('OOH Operator', { exact: true })).toHaveValue('JCDecaux');
    await expect(page.getByLabel(/Harm tags/i)).toHaveValue('greenwashing');
    // The accessible name of a <label> wrapping a <textarea> includes the
    // textarea's own value per the accname spec, so "Notes" is a prefix of
    // the computed name here, not the whole thing -- match on that prefix.
    await expect(page.getByRole('textbox', { name: /^Notes/i })).toHaveValue(/Shell branding/i);

    // AI is not presented as unquestionable fact: nothing is cataloged yet.
    expect(locationPosts.length).toBe(0);
    await expect(page.getByText('Cataloged to atlas').first()).toHaveCount(0);
  });

  test('an edited field overrides the AI value when cataloged', async ({ page }) => {
    let locationBody: Record<string, unknown> | null = null;
    await mockBase44(page, { user: null, locations: {} });
    await page.route('**/functions/scanAd', (route) =>
      route.fulfill({
        json: {
          detection: {
            is_advertising: true,
            brand_name: 'Shell',
            surface_type: 'billboard',
            industry_sector: 'fossil_fuel',
            confidence: 0.8,
          },
        },
      }),
    );
    await page.route('**/entities/Location', async (route) => {
      if (route.request().method() === 'POST') {
        locationBody = route.request().postDataJSON();
      }
      await route.fallback();
    });

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1]);
    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('Shell');

    // User corrects the AI's read.
    await page.getByLabel('Brand', { exact: true }).fill('Shell (misattributed — actually BP)');

    await setLatLng(page, '13.75', '100.50');
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();
    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible();

    expect((locationBody as unknown as { brand_name: string })?.brand_name).toBe(
      'Shell (misattributed — actually BP)',
    );
  });

  test('a scan failure is handled safely and can be retried', async ({ page }) => {
    await mockBase44(page, { user: null });
    let attempt = 0;
    await page.route('**/functions/scanAd', async (route) => {
      attempt += 1;
      if (attempt === 1) return route.fulfill({ status: 500, json: { error: 'boom' } });
      return route.fulfill({ json: { detection: { is_advertising: false, confidence: 0.1 } } });
    });

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1]);
    const runDetection = page.getByRole('button', { name: /Run detection/i });
    await runDetection.click();

    await expect(page.getByText(/Scan failed/i)).toBeVisible();
    // No crash, no stuck loading state -- the button is clickable again.
    await expect(runDetection).toBeEnabled();

    await runDetection.click();
    await expect(page.getByText('No ad', { exact: true })).toBeVisible();
  });
});

test.describe('Ad Scanner — catalog to atlas', () => {
  test('cover -> Location.image_url, extras -> LocationPhoto rows, no duplicates, persists on reload', async ({
    page,
  }, testInfo) => {
    const consoleErrors = trackConsoleErrors(page);
    const locationPosts: string[] = [];
    const photoPosts: Record<string, unknown>[] = [];
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
    // Cover + 2 extras.
    await (await uploadInput(page)).setInputFiles([IMG1, IMG2, IMG1]);
    await expect(page.locator('div:has(> button[aria-label="Remove photo"])')).toHaveCount(3);

    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('Shell');

    await setLatLng(page, '13.75', '100.50');
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();
    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible();

    // Exactly one Location record, exactly 2 LocationPhoto rows, no duplicates.
    expect(locationPosts.length).toBe(1);
    await expect.poll(() => photoPosts.length).toBe(2);
    const photoUrls = photoPosts.map((p) => p.url);
    expect(new Set(photoUrls).size).toBe(2);
    const locationIds = new Set(photoPosts.map((p) => p.location_id));
    expect(locationIds.size).toBe(1);

    await page.screenshot({
      path: `e2e/screenshots/${testInfo.project.name}/adscanner-cataloged.png`,
    });

    // Reload/open the saved location fresh (hard navigation, not a
    // client-side Link click) -- verifies persistence against the backend
    // itself, not whatever the SPA's client-side query cache happens to
    // hold over from the same tab/session.
    const detailHref = await page.getByRole('link', { name: /page ·/i }).getAttribute('href');
    await page.goto(detailHref!);
    await expect(page).toHaveURL(/\/location\//);
    await expect(page.getByRole('heading', { name: /Shell/i })).toBeVisible();

    // Cover persists as the single visible image. This session never
    // authenticated (mockBase44 was given user: null, matching real
    // anonymous field reporting), so LocationPhoto's own RLS
    // (base44/entities/LocationPhoto.jsonc: verified OR own OR admin) has no
    // created_by_id to match the pending extras against -- an anonymous
    // viewer correctly can't read them back, same as production. That's
    // enforced by the mock's RLS emulation (mockBase44.ts), not by
    // PhotoGallery.jsx re-filtering on the client -- see the next test for
    // the case that distinction actually matters: the *authenticated
    // creator* of these same rows.
    await expect(page.locator('img[alt="Ad scan · Shell"]').first()).toBeVisible();
    await expect(page.getByText(/^\d+ \/ \d+$/)).toHaveCount(0);

    expect(filterCrashes(consoleErrors), consoleErrors.join('\n')).toEqual([]);
  });

  test('creator sees their own pending gallery photos immediately after cataloging, not just the cover', async ({
    page,
  }) => {
    // Regression test for the confirmed production incident against
    // location 6aabfdc021a942360f9b7e4a (2026-09-17): all 11 uploaded extra
    // photos persisted correctly to LocationPhoto with the right
    // location_id, but the location's own creator saw only the cover photo
    // on /location/:id. Root cause: PhotoGallery.jsx filtered gallery rows
    // to status === 'verified' on the client, discarding pending rows even
    // when LocationPhoto's RLS already granted the viewer (its creator)
    // read access to them. The old mock never caught this because it
    // returned every fixture row to every viewer regardless of auth --
    // mockBase44.ts now mirrors the real RLS predicate, so this test fails
    // against the pre-fix PhotoGallery.jsx and passes against the fix.
    const OWNER = { id: 'scout-1', email: 'scout@oohearth.test', role: 'user', access: 'member' };
    await mockBase44(page, { user: OWNER, locations: {}, locationPhotos: [] });
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

    await openViaMenu(page);
    // Cover + 2 extras, same shape as the production report (cover uploaded
    // first, extras after).
    await (await uploadInput(page)).setInputFiles([IMG1, IMG2, IMG1]);
    await expect(page.locator('div:has(> button[aria-label="Remove photo"])')).toHaveCount(3);

    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('Shell');
    await setLatLng(page, '13.75', '100.50');
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();
    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible();

    const detailHref = await page.getByRole('link', { name: /page ·/i }).getAttribute('href');
    await page.goto(detailHref!);
    await expect(page).toHaveURL(/\/location\//);
    await expect(page.getByRole('heading', { name: /Shell/i })).toBeVisible();

    // All 3 photos (cover + 2 pending extras) render for the creator -- not
    // just the cover.
    await expect(page.getByTestId('photo-gallery').locator('img')).toHaveCount(3);
  });

  test('a failed extra-photo attach is surfaced to the user, not silently reported as a clean success', async ({
    page,
  }) => {
    // catalogLocation() used to await Promise.allSettled(...) and ignore the
    // result entirely -- a rejected LocationPhoto.create() vanished with no
    // user-visible signal, and the success toast/panel claimed an
    // unqualified "Cataloged to atlas" regardless. locationPhotoFailuresRemaining
    // makes the mock's next N LocationPhoto POSTs fail server-side.
    await mockBase44(page, {
      user: { id: 'scout-3', email: 'scout3@oohearth.test', role: 'user', access: 'member' },
      locations: {},
      locationPhotos: [],
      locationPhotoFailuresRemaining: 1,
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

    await openViaMenu(page);
    await (await uploadInput(page)).setInputFiles([IMG1, IMG2]); // cover + 1 extra (the one that fails)
    await page.getByRole('button', { name: /Run detection/i }).click();
    await expect(page.getByLabel('Brand', { exact: true })).toHaveValue('Shell');
    await setLatLng(page, '13.75', '100.50');
    await page.getByRole('button', { name: /Catalog to atlas/i }).click();

    // The location itself really was created -- that's still true and still said.
    await expect(page.getByText('Cataloged to atlas').first()).toBeVisible();
    // But the partial gallery failure has to be visible too, not swallowed
    // (matched via testid, not text, since the toast can carry the same
    // wording as the persistent panel notice and a loose text match would
    // hit both).
    await expect(page.getByTestId('photo-failure-notice')).toContainText(
      /1 photo failed to attach/i,
    );
  });
});

test.describe('Ad Scanner — /report regression guard', () => {
  test('/report multi-photo upload and camera capture are unaffected', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/report');
    await expect(page.getByRole('heading', { name: /Adbusting/i })).toBeVisible();

    const extraInput = page.locator('input[type="file"][multiple]');
    await extraInput.setInputFiles([IMG1, IMG2]);
    await expect(page.locator('div:has(> button[aria-label="Remove photo"])')).toHaveCount(2);

    // Cover photo capture/upload controls (label-wrapped, non-multiple inputs).
    await expect(page.getByRole('button', { name: 'Capture live' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
  });
});
