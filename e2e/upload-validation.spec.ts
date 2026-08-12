import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';
import { MAX_UPLOAD_BYTES } from '../src/lib/validateUpload';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');

// TrashId (/trash) is the simplest single-file upload call site -- one file
// input, one error display, no multi-file state -- so it's used here as the
// representative flow for validateUpload.js (src/lib/validateUpload.js),
// which every one of the 9 real photo-upload call sites shares. This isn't
// testing TrashId-specific behavior, it's testing the shared validator
// through a real UI path rather than in isolation (no unit-test runner
// exists in this repo -- see KNOWN_ISSUES.md discussion in the PR this spec
// ships with).

test.describe('Upload validation (src/lib/validateUpload.js, via /trash)', () => {
  test('valid supported image uploads successfully', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/trash');

    await page.locator('input[type="file"]').setInputFiles(REAL_IMAGE);

    // A real image passes validation and proceeds to the upload+analysis
    // flow -- no validation error appears, and the preview renders.
    await expect(
      page.getByText(/max \d+MB|unsupported file type|doesn't match|doesn't look like/i),
    ).toHaveCount(0);
    await expect(page.locator('img[alt="trash evidence"]')).toBeVisible();
  });

  test('oversized image is rejected with a clear, recoverable error', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/trash');

    const oversized = Buffer.alloc(MAX_UPLOAD_BYTES + 1024, 0);
    // Give it a real JPEG signature so size is the *only* thing that fails --
    // proves the size check specifically, not a signature-check false hit.
    oversized[0] = 0xff;
    oversized[1] = 0xd8;
    oversized[2] = 0xff;

    await page.locator('input[type="file"]').setInputFiles({
      name: 'huge.jpg',
      mimeType: 'image/jpeg',
      buffer: oversized,
    });

    await expect(page.getByText(/too large/i)).toBeVisible();
    // No preview should render for a rejected file -- upload never started.
    await expect(page.locator('img[alt="trash evidence"]')).toHaveCount(0);

    // Recovery: picking a valid file afterward works normally.
    await page.locator('input[type="file"]').setInputFiles(REAL_IMAGE);
    await expect(page.getByText(/too large/i)).toHaveCount(0);
    await expect(page.locator('img[alt="trash evidence"]')).toBeVisible();
  });

  test('unsupported file type is rejected', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/trash');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('this is not an image'),
    });

    await expect(page.getByText(/unsupported file type/i)).toBeVisible();
    await expect(page.locator('img[alt="trash evidence"]')).toHaveCount(0);
  });

  test('mismatched extension/MIME is rejected even with a valid-looking type', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/trash');

    // Browser reports image/jpeg (a valid, accepted MIME), but the filename
    // claims .png -- the extension cross-check should catch this even
    // though the MIME allowlist check alone would have passed it.
    await page.locator('input[type="file"]').setInputFiles({
      name: 'photo.png',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
    });

    await expect(page.getByText(/doesn't match its type/i)).toBeVisible();
  });

  test("file content that doesn't match its claimed type is rejected", async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/trash');

    // Correct MIME + matching extension, but the actual bytes aren't a real
    // JPEG -- the signature check should catch what the MIME/extension
    // checks alone can't (a renamed non-image file with a spoofed .type).
    await page.locator('input[type="file"]').setInputFiles({
      name: 'fake.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('not actually a jpeg'),
    });

    await expect(page.getByText(/doesn't look like a real image/i)).toBeVisible();
  });
});
