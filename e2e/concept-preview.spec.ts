import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes } from './fixtures/mockBase44';

// #320 Live Canvas checkpoint's only authorized implementation step before
// the owner resolves its 5 open publishing/rights/moderation questions: a
// nonpersistent, local-only preview using an existing approved asset, with
// an always-visible CONCEPT label, no save/share/publish/upload/backend
// call. See docs/ops/ooh-earth/12-LIVE-CANVAS-CHECKPOINT.md and
// src/components/ooh/ConceptPreview.jsx.

function svg(color: string, label = '') {
  const body = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='${color}'/><text x='50%' y='50%' font-size='28' fill='white' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(body)}`;
}

test.describe('ConceptPreview — #320 nonpersistent local preview', () => {
  test('shows the permanent CONCEPT label, never saves, resets on close', async ({ page }) => {
    // Scoped to /entities/ writes specifically -- LocationDetail's own
    // existing page load already fires unrelated POSTs (analytics tracking,
    // weather/biodiversity/heritage context, fieldNews) regardless of this
    // feature; those are documented, pre-existing platform/page behavior,
    // not something ConceptPreview does or could cause.
    const entityWrites: string[] = [];
    page.on('request', (request) => {
      if (
        ['POST', 'PUT', 'DELETE'].includes(request.method()) &&
        /\/entities\//.test(request.url())
      )
        entityWrites.push(`${request.method()} ${request.url()}`);
    });
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await mockBase44(page, {
      user: null,
      locations: {
        'loc-concept-1': {
          id: 'loc-concept-1',
          title: 'Billboard · Concept Test',
          type: 'billboard',
          address: '1 Concept Ave',
          lat: 13.75,
          lng: 100.5,
          image_url: svg('%231F51FF', 'EXISTING'),
          status: 'verified',
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });

    await page.goto('/location/loc-concept-1');
    await expect(page.getByRole('heading', { name: /Concept Test/i })).toBeVisible();

    const sessionKeysBefore = await page.evaluate(() => Object.keys(sessionStorage));
    const localKeysBefore = await page.evaluate(() => Object.keys(localStorage));

    await page.getByTestId('concept-preview-open').click();
    const dialog = page.getByTestId('concept-preview-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Concept · Not live')).toHaveCount(2); // header + image overlay
    await expect(dialog.locator('img')).toHaveAttribute('src', /EXISTING|data:image/);

    const captionInput = dialog.getByPlaceholder(/mural across the lower third/i);
    await captionInput.fill('A rooftop garden mockup');
    await expect(dialog.getByText('A rooftop garden mockup')).toBeVisible();

    // Exact name: the Dialog primitive's own default "X" button is also
    // named "Close" (loose match hits both).
    await dialog.getByRole('button', { name: 'Close (discards this)' }).click();
    await expect(dialog).toBeHidden();

    // Reopen: the caption must be gone. This is the actual nonpersistence
    // guarantee, not just an absence of a save button.
    await page.getByTestId('concept-preview-open').click();
    await expect(
      page.getByTestId('concept-preview-dialog').getByText('A rooftop garden mockup'),
    ).toHaveCount(0);
    await page
      .getByTestId('concept-preview-dialog')
      .getByRole('button', { name: 'Close (discards this)' })
      .click();

    const sessionKeysAfter = await page.evaluate(() => Object.keys(sessionStorage));
    const localKeysAfter = await page.evaluate(() => Object.keys(localStorage));
    expect(sessionKeysAfter).toEqual(sessionKeysBefore);
    expect(localKeysAfter).toEqual(localKeysBefore);
    expect(entityWrites).toEqual([]);
    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });

  test('a location with no existing photo shows a safe fallback, not a crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await mockBase44(page, {
      user: null,
      locations: {
        'loc-concept-2': {
          id: 'loc-concept-2',
          title: 'Billboard · No Photo Yet',
          type: 'billboard',
          address: '2 Concept Ave',
          lat: 13.75,
          lng: 100.5,
          status: 'verified',
          access_key: 'none',
        },
      },
      locationPhotos: [],
    });
    await page.goto('/location/loc-concept-2');
    await expect(page.getByRole('heading', { name: /No Photo Yet/i })).toBeVisible();
    await page.getByTestId('concept-preview-open').click();
    await expect(
      page.getByText('No existing photo here yet to preview a concept against.'),
    ).toBeVisible();
    expect(filterCrashes(errors), errors.join('\n')).toEqual([]);
  });
});
