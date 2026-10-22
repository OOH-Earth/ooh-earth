import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import exifr from 'exifr';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// imageCompress.js is this app's only metadata-stripping step for uploaded
// photos. Every current caller (this suite drives FieldReport's cover-photo
// upload, but the fix applies to all of them -- QuickCapture,
// FieldCheckCamera, GraffitiCamera, GraffitiCam, AdScanLab, TrashId) is a
// field-evidence photo of a real-world location, several explicitly
// offered as "Anonymous field capture." Prior to this fix, three branches
// forwarded the original file -- and its EXIF GPS/device metadata -- to
// the server unmodified: an already-small-and-in-bounds image, a
// compressed-result-bigger-than-original fallback, and any processing
// failure (including HEIC on non-Safari browsers, which cannot decode it
// at all). All three now either re-encode (stripping metadata by
// construction, since canvas carries no memory of the source file's
// metadata) or throw, never silently forwarding the original.
//
// e2e/fixtures/exif-gps-fixture.jpg carries synthetic (not real personal)
// EXIF: GPS 37.422,-122.084, Make "SyntheticTestCam", Model "TestModel-9000",
// a fake body serial number, and DateTimeOriginal -- generated via piexifjs
// for this fixture only (piexifjs is not a runtime dependency of the app).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXIF_GPS_FIXTURE = path.join(__dirname, 'fixtures', 'exif-gps-fixture.jpg');
const ORIENTATION_FIXTURE = path.join(__dirname, 'fixtures', 'orientation-fixture.jpg');
const CORRUPTED_FIXTURE = path.join(__dirname, 'fixtures', 'corrupted-fixture.jpg');

// UploadFile is sent as multipart/form-data (see
// @base44/sdk/dist/modules/integrations.js), so a route handler's raw
// postDataBuffer() is the whole multipart body -- boundary markers and
// Content-Disposition headers included, not clean file bytes. Extracts one
// named part's binary content.
function extractMultipartFilePart(
  body: Buffer,
  contentType: string | undefined,
  fieldName: string,
): Buffer {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? '');
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];
  if (!boundary) throw new Error('No multipart boundary found in Content-Type header');
  const marker = Buffer.from(`--${boundary}`);
  const parts: Buffer[] = [];
  let start = body.indexOf(marker);
  while (start !== -1) {
    const next = body.indexOf(marker, start + marker.length);
    if (next === -1) break;
    parts.push(body.subarray(start + marker.length, next));
    start = next;
  }
  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headerText = part.subarray(0, headerEnd).toString('utf8');
    if (!new RegExp(`name="${fieldName}"`).test(headerText)) continue;
    // Strip the trailing \r\n before the next boundary marker.
    return part.subarray(headerEnd + 4, part.length - 2);
  }
  throw new Error(`Multipart field "${fieldName}" not found`);
}

async function fillMinimalReportFields(page: import('@playwright/test').Page) {
  await page.goto('/report');
  await page.getByPlaceholder('Street, district, city').fill('900 Test Ave, Testville');
}

test.describe('Image privacy — EXIF/device metadata stripped before upload', () => {
  test('GPS + device metadata removed from an already-small image (the size-skip branch)', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const db: MockDb = { user: null, locations: {}, locationPhotos: [] };
    await mockBase44(page, db);

    let uploadedFileBytes: Buffer | null = null;
    await page.route('**/integration-endpoints/Core/UploadFile', async (route) => {
      const req = route.request();
      const body = req.postDataBuffer();
      if (body) {
        uploadedFileBytes = extractMultipartFilePart(body, req.headers()['content-type'], 'file');
      }
      await route.fulfill({ json: { file_url: 'https://example.com/mock-upload.jpg' } });
    });

    await fillMinimalReportFields(page);

    // The exif-gps-fixture is 1041 bytes and well under 1920px on its
    // longest edge -- exactly the "small, in-bounds" branch that used to
    // return the original file untouched.
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(EXIF_GPS_FIXTURE);

    // exifr.gps(file) auto-fills the app's own structured lat/lng from the
    // EXIF GPS -- this is the intentional, explicit application record the
    // mission distinguishes from hidden image metadata. Proves the feature
    // this fixture is designed to also exercise still works.
    await expect(page.getByPlaceholder('Latitude')).toHaveValue('37.42200', { timeout: 10_000 });
    await expect(page.getByPlaceholder('Longitude')).toHaveValue('-122.08400');

    await expect(page.getByText(/Replace/i)).toBeVisible({ timeout: 10_000 });
    expect(uploadedFileBytes, 'no file reached UploadFile').not.toBeNull();

    const tags = await exifr.parse(uploadedFileBytes as Buffer, true);
    expect(tags?.GPSLatitude, 'GPS latitude must not survive').toBeUndefined();
    expect(tags?.GPSLongitude, 'GPS longitude must not survive').toBeUndefined();
    expect(tags?.Make, 'device make must not survive').toBeUndefined();
    expect(tags?.Model, 'device model must not survive').toBeUndefined();
    expect(tags?.SerialNumber, 'device serial must not survive').toBeUndefined();
  });

  test('a processing failure throws instead of silently uploading the metadata-bearing original', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const db: MockDb = { user: null, locations: {}, locationPhotos: [] };
    await mockBase44(page, db);

    // e2e/fixtures/corrupted-fixture.jpg: the first 20 bytes of a real JPEG
    // (SOI + partial header, no scan data) -- passes validateImageFile's
    // magic-byte signature check (0xFFD8FF) but cannot actually be decoded.
    // Verified independently before writing this test that both
    // createImageBitmap() and <img> genuinely fail on it (not simulated).
    let uploadCalled = false;
    await page.route('**/integration-endpoints/Core/UploadFile', async (route) => {
      uploadCalled = true;
      await route.fulfill({ json: { file_url: 'https://example.com/mock-upload.jpg' } });
    });

    await fillMinimalReportFields(page);
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(CORRUPTED_FIXTURE);

    await expect(page.getByText(/Photo upload failed/i)).toBeVisible({ timeout: 10_000 });
    expect(uploadCalled, 'UploadFile must never be called when processing fails').toBe(false);
  });

  test('orientation is preserved (a rotated photo is not uploaded sideways)', async ({ page }) => {
    test.setTimeout(30_000);
    const db: MockDb = { user: null, locations: {}, locationPhotos: [] };
    await mockBase44(page, db);

    let uploadedBase64 = '';
    await page.route('**/integration-endpoints/Core/UploadFile', async (route) => {
      const req = route.request();
      const body = req.postDataBuffer();
      if (body) {
        uploadedBase64 = extractMultipartFilePart(
          body,
          req.headers()['content-type'],
          'file',
        ).toString('base64');
      }
      await route.fulfill({ json: { file_url: 'https://example.com/mock-upload.jpg' } });
    });

    // e2e/fixtures/orientation-fixture.jpg: a 100x50 (wide) stored JPEG
    // tagged Orientation=6 (rotate 90° CW to view correctly), generated via
    // piexifjs for this fixture only. Verified independently before
    // writing this test that createImageBitmap()/<img> both already decode
    // it as 50x100 -- a correctly oriented output must match that, not the
    // 100x50 raw stored orientation.
    await fillMinimalReportFields(page);
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(ORIENTATION_FIXTURE);

    await expect(page.getByText(/Replace/i)).toBeVisible({ timeout: 10_000 });
    expect(uploadedBase64).not.toBe('');

    const dims = await page.evaluate(
      (b64) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = reject;
          img.src = 'data:image/jpeg;base64,' + b64;
        }),
      uploadedBase64,
    );
    expect(dims).toEqual({ w: 50, h: 100 });
  });

  test('"extra" gallery photos are routed through the same compressImage() as the cover photo', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    const db: MockDb = { user: null, locations: {}, locationPhotos: [] };
    await mockBase44(page, db);

    // uploadLocationPhotos() (src/components/ooh/gallery/MultiPhotoUpload.jsx)
    // is a separate upload call site from the cover photo's, fired after
    // the Location record exists -- it bypassed compressImage entirely
    // until this fix, uploading every "additional photo" beyond the cover
    // with its original EXIF intact regardless of the cover-photo fix.
    //
    // Proven here via failure semantics, not by inspecting the uploaded
    // bytes: a genuinely undecodable "extra" photo now throws inside
    // compressImage() (see the corrupted-fixture test above) instead of
    // reaching UploadFile at all. If this call site did NOT route through
    // compressImage, the corrupted extra photo would upload directly with
    // no error -- attempting to capture and parse the actual multipart
    // bytes for TWO sequential UploadFile calls in one page session hit an
    // unrelated Playwright/CDP quirk that intermittently truncates the
    // second body regardless of file content (reproduced even with two
    // clean, unrelated images against pre-fix code) -- request COUNTING is
    // reliable where byte capture was not, so that's what this asserts.
    let uploadCalls = 0;
    await page.route('**/integration-endpoints/Core/UploadFile', async (route) => {
      uploadCalls++;
      await route.fulfill({ json: { file_url: 'https://example.com/mock-upload.jpg' } });
    });
    let locationPhotoCreates = 0;
    await page.route('**/entities/LocationPhoto', async (route) => {
      if (route.request().method() === 'POST') locationPhotoCreates++;
      await route.fallback();
    });

    await fillMinimalReportFields(page);
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('13.75');
    await page.getByPlaceholder('Longitude').fill('100.50');

    // Cover: a clean image (must still succeed normally). Extra: the
    // corrupted fixture -- passes validateImageFile's signature check but
    // cannot be decoded, so compressImage() must throw for it.
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(ORIENTATION_FIXTURE);
    await expect(page.getByText(/Replace/i)).toBeVisible({ timeout: 10_000 });
    await page.locator('input[type="file"][multiple]').setInputFiles(CORRUPTED_FIXTURE);
    await expect(page.locator('div:has(> button[aria-label="Remove photo"])')).toHaveCount(1);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await submitBtn.click();
    await submitBtn.click();
    await expect(submitBtn).toHaveText(/Transmit report/i);
    await submitBtn.click();
    await expect(page.getByText(/Transmission received/i)).toBeVisible({ timeout: 10_000 });

    // uploadLocationPhotos() fires after the Location record exists, not
    // awaited by the UI transition -- give its Promise.allSettled a moment
    // to land before asserting the final counts.
    await page.waitForTimeout(2000);

    expect(uploadCalls, 'only the cover photo should reach UploadFile').toBe(1);
    expect(
      locationPhotoCreates,
      'the corrupted extra photo must never become a LocationPhoto row',
    ).toBe(0);
  });
});

test.describe('Accepted formats — GIF is rejected before upload', () => {
  // A minimal valid GIF89a with a comment extension: the kind of file whose
  // bytes would previously have reached storage unchanged.
  const GIF_WITH_COMMENT = Buffer.from(
    '474946383961010001008000000000ffffff2c00000000010001000002024401003b',
    'hex',
  );

  test('a GIF is refused with a clear message, never uploaded, and the form keeps its data', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });
    let uploads = 0;
    await page.route('**/integration-endpoints/Core/UploadFile', async (route) => {
      uploads += 1;
      await route.fulfill({ json: { file_url: 'https://example.com/mock-upload.jpg' } });
    });

    await fillMinimalReportFields(page);
    await page.getByText('Enter coordinates manually').click();
    await page.getByPlaceholder('Latitude').fill('51.50100');
    await page.getByPlaceholder('Longitude').fill('-0.14200');

    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles({ name: 'meme.gif', mimeType: 'image/gif', buffer: GIF_WITH_COMMENT });

    await expect(page.getByText(/GIF files are not accepted/i)).toBeVisible();
    expect(uploads, 'a GIF must never reach UploadFile').toBe(0);
    await expect(page.getByPlaceholder('Street, district, city')).toHaveValue(
      '900 Test Ave, Testville',
    );
    await expect(page.getByPlaceholder('Latitude')).toHaveValue('51.50100');
    await expect(page.getByText(/^Replace$/i)).toHaveCount(0);
  });

  test('guidance lists the supported formats and no longer implies GIF works', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });
    await page.goto('/report');
    const guidance = page.getByTestId('photo-privacy-guidance');
    await expect(guidance).toContainText('JPG, PNG, WebP or HEIC');
    await expect(guidance).toContainText('GIF is not accepted');
  });

  test('a supported JPEG still uploads and a failed upload keeps the form data', async ({
    page,
  }) => {
    test.setTimeout(30_000);
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });
    let fail = true;
    await page.route('**/integration-endpoints/Core/UploadFile', async (route) => {
      if (fail) return route.fulfill({ status: 500, json: { error: 'x' } });
      await route.fulfill({ json: { file_url: 'https://example.com/mock-upload.jpg' } });
    });
    await fillMinimalReportFields(page);
    const input = page.getByRole('button', { name: 'Upload' }).locator('input[type="file"]');
    await input.setInputFiles(ORIENTATION_FIXTURE);
    await expect(page.getByText(/Photo upload failed/i)).toBeVisible();
    await expect(page.getByPlaceholder('Street, district, city')).toHaveValue(
      '900 Test Ave, Testville',
    );
    fail = false;
    await input.setInputFiles(ORIENTATION_FIXTURE);
    await expect(page.getByText(/Replace/i)).toBeVisible({ timeout: 10_000 });
  });

  test('an undecodable HEIC is refused before upload with a clear message, form data kept', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === 'webkit',
      'Safari can decode HEIC; this asserts the non-decoding path',
    );
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });
    let uploads = 0;
    await page.route('**/integration-endpoints/Core/UploadFile', async (route) => {
      uploads += 1;
      await route.fulfill({ json: { file_url: 'https://example.com/mock-upload.jpg' } });
    });
    await fillMinimalReportFields(page);
    // ISO-BMFF "ftypheic" header only: a HEIC by label that no browser here can decode.
    const fakeHeic = Buffer.from(
      '000000186674797068656963000000006d696631686569630000000000',
      'hex',
    );
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles({ name: 'IMG_0001.heic', mimeType: 'image/heic', buffer: fakeHeic });
    await expect(page.getByText(/can't read HEIC photos/i)).toBeVisible();
    expect(uploads, 'an undecodable HEIC must never reach UploadFile').toBe(0);
    await expect(page.getByPlaceholder('Street, district, city')).toHaveValue(
      '900 Test Ave, Testville',
    );
  });

  test('a supported JPEG shows a preview and sends exactly one upload', async ({ page }) => {
    test.setTimeout(30_000);
    await mockBase44(page, { user: null, locations: {}, locationPhotos: [] });
    let uploads = 0;
    await page.route('**/integration-endpoints/Core/UploadFile', async (route) => {
      uploads += 1;
      await route.fulfill({ json: { file_url: 'https://example.com/mock-upload.jpg' } });
    });
    await fillMinimalReportFields(page);
    await page
      .getByRole('button', { name: 'Upload' })
      .locator('input[type="file"]')
      .setInputFiles(ORIENTATION_FIXTURE);
    await expect(page.getByText(/Replace/i)).toBeVisible({ timeout: 10_000 });
    expect(uploads).toBe(1);
  });
});
