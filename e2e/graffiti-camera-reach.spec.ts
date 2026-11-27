import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// The map's graffiti camera shared quick capture's defect: rendered inside the map page's fixed
// root, it was painted under the mobile navigation and the contextual hint. It also dropped the
// coordinate fields mid-typing, and had no dialog semantics.
// All writes are mocked: nothing here proves real submission.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE = path.join(__dirname, 'fixtures', 'test-image.png');
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function setup(page: Page) {
  await mockBase44(page, { user: null, locations: {}, uploadUrl: PIXEL });
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
    if (request.url().includes('/functions/submitOffline')) submits.push(request.method());
  });
  return { submits };
}

async function openGraffiti(page: Page) {
  await page.goto('/map');
  const trigger = page.getByRole('button', { name: 'Graffiti camera', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Graffiti field camera' });
  await expect(dialog.getByRole('textbox', { name: 'Latitude' })).toBeVisible();
  return { dialog, trigger };
}

async function expectUnobstructed(target: Locator, label: string) {
  await target.evaluate((el) => el.scrollIntoView({ block: 'nearest', behavior: 'instant' }));
  await expect
    .poll(
      () =>
        target.evaluate((el) => {
          const box = el.getBoundingClientRect();
          const blocked: string[] = [];
          if (box.top < 0 || box.bottom > innerHeight + 0.5 || box.right > innerWidth + 0.5)
            blocked.push('off screen');
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

for (const viewport of [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 768 },
]) {
  test(`graffiti fields, close and submit are reachable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await setup(page);
    const { dialog } = await openGraffiti(page);
    await page.waitForTimeout(2200); // let the delayed contextual hint appear

    const close = dialog.getByRole('button', { name: 'Close', exact: true });
    await expectUnobstructed(close, 'close');
    const size = (await close.boundingBox())!;
    expect(Math.min(size.width, size.height)).toBeGreaterThanOrEqual(44);

    for (const [label, control] of [
      ['medium', dialog.getByRole('combobox', { name: 'Medium' })],
      ['surface', dialog.getByRole('spinbutton', { name: /Surface/ })],
      ['address', dialog.getByRole('textbox', { name: 'Street or district (optional)' })],
      ['latitude', dialog.getByRole('textbox', { name: 'Latitude' })],
      ['longitude', dialog.getByRole('textbox', { name: 'Longitude' })],
      ['submit', dialog.getByRole('button', { name: 'Transmit capture' })],
    ] as const) {
      await expectUnobstructed(control, label);
    }
  });
}

test.describe('graffiti camera behaviour (mocked backend)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('typed coordinates stay editable, and validation is announced and visible', async ({
    page,
  }) => {
    const { submits } = await setup(page);
    const { dialog } = await openGraffiti(page);
    const lat = dialog.getByRole('textbox', { name: 'Latitude' });
    const lng = dialog.getByRole('textbox', { name: 'Longitude' });
    await lat.fill('13.7563');
    await lng.pressSequentially('100.5018', { delay: 30 });
    await expect(lng).toHaveValue('100.5018');
    await expect(lng).toBeFocused();
    await lat.fill('13.7564');
    await expect(lat).toHaveValue('13.7564');
    await dialog.getByRole('button', { name: 'Transmit capture' }).click();
    await expect(dialog.getByRole('alert')).toHaveText(/photograph first/i);
    await expect(dialog.getByRole('alert')).toBeInViewport({ ratio: 1 });
    expect(submits).toEqual([]);
  });

  test('focus stays inside the dialog and returns to its trigger on Escape', async ({ page }) => {
    await setup(page);
    const { dialog, trigger } = await openGraffiti(page);
    await dialog.getByRole('button', { name: 'Transmit capture' }).focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  async function fillValid(page: Page) {
    const { dialog } = await openGraffiti(page);
    await dialog.locator('label input[type="file"]').first().setInputFiles(IMAGE);
    await expect(dialog.getByRole('button', { name: 'Retake' })).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Latitude' }).fill('13.7563');
    await dialog.getByRole('textbox', { name: 'Longitude' }).fill('100.5018');
    return dialog;
  }

  test('success: a double activation sends one request', async ({ page }) => {
    const { submits } = await setup(page);
    const dialog = await fillValid(page);
    await dialog.getByRole('button', { name: 'Transmit capture' }).dblclick();
    await expect(dialog.getByRole('heading', { name: 'Captured' })).toBeVisible();
    expect(submits).toEqual(['POST']);
  });

  test('server error: says not sent, without claiming the device is offline', async ({ page }) => {
    await setup(page);
    await page.route('**/functions/submitOffline', (route) =>
      route.fulfill({ status: 503, json: { error: 'mocked failure' } }),
    );
    const dialog = await fillValid(page);
    await dialog.getByRole('button', { name: 'Transmit capture' }).click();
    await expect(dialog.getByRole('heading', { name: 'Saved, not sent yet' })).toBeVisible();
    await expect(dialog.getByText(/could not send this just now/i)).toBeVisible();
    await expect(dialog.getByText(/has not been submitted/i)).toBeVisible();
    await expect(dialog.getByText(/you are offline/i)).toHaveCount(0);
  });

  test('offline: says the device is offline', async ({ page, context }) => {
    const { submits } = await setup(page);
    const dialog = await fillValid(page);
    await context.setOffline(true);
    await dialog.getByRole('button', { name: 'Transmit capture' }).click();
    await expect(dialog.getByText(/you are offline/i)).toBeVisible();
    expect(submits).toEqual([]);
    await context.setOffline(false);
  });

  test('slow send: explains the wait without sending twice or giving up', async ({ page }) => {
    const { submits } = await setup(page);
    await page.route('**/functions/submitOffline', () => {});
    const dialog = await fillValid(page);
    await dialog.getByRole('button', { name: 'Transmit capture' }).click();
    await expect(dialog.getByRole('button', { name: 'Transmitting…' })).toBeDisabled();
    await expect(dialog.getByRole('status')).toHaveCount(0);
    await expect(dialog.getByRole('status')).toHaveText(/still sending/i, { timeout: 15_000 });
    await expect(dialog.getByRole('button', { name: 'Transmitting…' })).toBeDisabled();
    expect(submits).toEqual(['POST']);
  });
});
