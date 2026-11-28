import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Regression coverage for quick capture being painted under the page chrome. The dialog was
// rendered inside the Map page's fixed root, whose stacking context trapped its z-index below
// the mobile navigation, the desktop bottom bar and the contextual hint.
// All network writes are mocked: this proves layout and client behaviour, not real submission.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 768 },
];

async function setup(page: Page) {
  const db = { user: null, locations: {} as Record<string, unknown>, uploadUrl: PIXEL };
  await mockBase44(page, db);
  await page.addInitScript(() => {
    localStorage.setItem('ooh-map-view', JSON.stringify('flat'));
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: (_ok: unknown, fail: Function) => fail({ code: 1 }) },
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: () => Promise.reject(new Error('Camera unavailable')) },
    });
  });
  const submits: string[] = [];
  page.on('request', (request) => {
    // Ticket reservations are not submissions.
    if (
      request.url().includes('/functions/submitOffline') &&
      request.postDataJSON()?.action !== 'reserve'
    )
      submits.push(request.method());
  });
  return { submits };
}

async function openCapture(page: Page, route = '/map') {
  await page.goto(route);
  const trigger =
    route === '/map'
      ? page.getByRole('button', { name: 'Capture photo', exact: true })
      : page.locator('button:has(svg.lucide-camera)').first();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Anonymous field capture' });
  await expect(dialog.getByRole('textbox', { name: 'Latitude' })).toBeVisible();
  return dialog;
}

/** Every sampled point of the whole box, edges and corners included, must hit the element. */
async function expectUnobstructed(target: Locator, label: string) {
  await target.evaluate((el) => el.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
  await expect
    .poll(
      () =>
        target.evaluate((el) => {
          const box = el.getBoundingClientRect();
          const blocked: string[] = [];
          if (box.top < 0 || box.left < 0) blocked.push('off screen (top/left)');
          if (box.bottom > innerHeight + 0.5 || box.right > innerWidth + 0.5)
            blocked.push('off screen (bottom/right)');
          for (let i = 0; i <= 8; i++) {
            for (let j = 0; j <= 4; j++) {
              const x = box.left + 1 + ((box.width - 2) * i) / 8;
              const y = box.top + 1 + ((box.height - 2) * j) / 4;
              const hit = document.elementFromPoint(x, y);
              if (!hit || !(hit === el || el.contains(hit)))
                blocked.push(`${Math.round(x)},${Math.round(y)}`);
            }
          }
          return blocked.slice(0, 5).join(' | ');
        }),
      { message: `${label} must be completely unobstructed` },
    )
    .toBe('');
}

for (const viewport of VIEWPORTS) {
  const size = `${viewport.width}x${viewport.height}`;

  test(`every capture control is reachable and unobstructed at ${size}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await setup(page);
    const dialog = await openCapture(page);
    // Let the delayed contextual hint appear (it shows after ~1.4s) before measuring.
    await page.waitForTimeout(2200);

    const close = dialog.getByRole('button', { name: 'Close', exact: true });
    await expectUnobstructed(close, 'close');
    const closeBox = (await close.boundingBox())!;
    expect(Math.min(closeBox.width, closeBox.height)).toBeGreaterThanOrEqual(44);

    for (const [label, control] of [
      ['gallery picker', dialog.getByText('Or choose from gallery')],
      ['address', dialog.getByRole('textbox', { name: 'Street or district (optional)' })],
      ['latitude', dialog.getByRole('textbox', { name: 'Latitude' })],
      ['longitude', dialog.getByRole('textbox', { name: 'Longitude' })],
      ['submit', dialog.getByRole('button', { name: 'Transmit capture' })],
    ] as const) {
      await expectUnobstructed(control, label);
    }

    // No blank tail: the submit button ends at the panel's own bottom padding.
    const tail = await dialog.evaluate((panel) => {
      panel.scrollTop = panel.scrollHeight;
      const submit = [...panel.querySelectorAll('button')].at(-1)!;
      return panel.getBoundingClientRect().bottom - submit.getBoundingClientRect().bottom;
    });
    expect(tail).toBeLessThanOrEqual(32);
  });

  test(`keyboard focus and validation messages stay visible at ${size}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const { submits } = await setup(page);
    const dialog = await openCapture(page);
    const submit = dialog.getByRole('button', { name: 'Transmit capture' });

    await dialog.getByRole('textbox', { name: 'Longitude' }).focus();
    await page.keyboard.press('Tab');
    await expect(submit).toBeFocused();
    await expectUnobstructed(submit, 'focused submit');

    await page.keyboard.press('Enter');
    const missingPhoto = dialog.getByRole('alert');
    await expect(missingPhoto).toHaveText(/photograph first/i);
    await expect(missingPhoto).toBeInViewport({ ratio: 1 });

    await dialog.locator('label input[type="file"]').first().setInputFiles(IMAGE);
    await expect(dialog.getByRole('button', { name: 'Retake' })).toBeVisible();
    await submit.click();
    await expect(dialog.getByRole('alert')).toHaveText(/coordinates required/i);
    await expect(dialog.getByRole('alert')).toBeInViewport({ ratio: 1 });
    expect(submits).toEqual([]);
  });
}

async function fillValidCapture(page: Page) {
  const dialog = await openCapture(page);
  await dialog.locator('label input[type="file"]').first().setInputFiles(IMAGE);
  await expect(dialog.getByRole('button', { name: 'Retake' })).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Latitude' }).fill('13.7563');
  await dialog.getByRole('textbox', { name: 'Longitude' }).fill('100.5018');
  return dialog;
}

test.describe('quick capture submission states (mocked backend)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('success: a double activation sends one request', async ({ page }) => {
    const { submits } = await setup(page);
    const dialog = await fillValidCapture(page);
    await dialog.getByRole('button', { name: 'Transmit capture' }).dblclick();
    await expect(dialog.getByRole('heading', { name: 'Captured' })).toBeVisible();
    expect(submits).toEqual(['POST']);
  });

  test('server error: the capture is reported as queued on the device', async ({ page }) => {
    const { submits } = await setup(page);
    await page.route('**/functions/submitOffline', (route) => {
      // Let the ticket reservation through; fail or hold the send itself.
      if (route.request().postDataJSON()?.action) return route.fallback();
      return route.fulfill({ status: 500, json: { error: 'mocked failure' } });
    });
    const dialog = await fillValidCapture(page);
    await dialog.getByRole('button', { name: 'Transmit capture' }).click();
    await expect(dialog.getByRole('heading', { name: 'Saved, not sent yet' })).toBeVisible();
    expect(submits.length).toBeGreaterThanOrEqual(1);
  });

  test('slow response: the button stays busy and cannot send twice', async ({ page }) => {
    const { submits } = await setup(page);
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    await page.route('**/functions/submitOffline', async (route) => {
      // Let the ticket reservation through; fail or hold the send itself.
      if (route.request().postDataJSON()?.action) return route.fallback();
      await held;
      await route.abort('timedout');
    });
    const dialog = await fillValidCapture(page);
    await dialog.getByRole('button', { name: 'Transmit capture' }).click();
    const busy = dialog.getByRole('button', { name: 'Transmitting…' });
    await expect(busy).toBeDisabled();
    // The send follows the ticket reservation.
    await expect.poll(() => submits).toEqual(['POST']);
    await busy.click({ force: true });
    expect(submits).toEqual(['POST']);
    release();
    await expect(dialog.getByRole('heading', { name: 'Saved, not sent yet' })).toBeVisible();
  });

  test('Escape closes the dialog and leaves the hint and navigation usable', async ({ page }) => {
    await setup(page);
    const dialog = await openCapture(page);
    await page.waitForTimeout(2200);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    const abort = page.getByRole('button', { name: 'Abort' });
    await expectUnobstructed(abort, 'hint dismiss button');
    await abort.focus();
    await page.keyboard.press('Enter');
    // The hint fades out and records the dismissal; it stays mounted.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('ooh_nudge_map_report')))
      .toBe('1');
    await expectUnobstructed(
      page.locator('.ooh-mobile-nav > *').first(),
      'bottom navigation after close',
    );
  });
});

for (const route of ['/adbusting', '/graffiti']) {
  test(`capture submit is unobstructed when opened from ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setup(page);
    const dialog = await openCapture(page, route);
    await expectUnobstructed(
      dialog.getByRole('button', { name: 'Transmit capture' }),
      'portal submit',
    );
  });
}
