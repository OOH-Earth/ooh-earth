import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// The AI Unit Finder no longer generates units or writes Location records (contained 2026-10).
// Opening it must show the unavailable notice, keep the existing focus-trap contract, make no
// AI-integration request and no Location create request, and point to the manual Report form.
// Desktop-only for the same reason as unit-finder-focus-trap.spec.ts ("Find units" is `hidden md:flex`).

test.describe('UnitFinder — generation and write path contained', () => {
  test('shows the unavailable notice and makes no AI or Location-write request', async ({
    page,
  }) => {
    const aiOrWrite: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (/InvokeLLM/i.test(url)) aiOrWrite.push(`${req.method()} ${url}`);
      if (req.method() === 'POST' && /\/entities\/Location(\?|$)/.test(url)) {
        aiOrWrite.push(`${req.method()} ${url}`);
      }
    });
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/map');

    await page.getByRole('button', { name: 'Find units' }).click();
    const dialog = page.getByRole('dialog', { name: 'AI Unit Finder' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('unit-finder-unavailable')).toContainText('Unavailable');
    await expect(dialog.getByRole('textbox')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: /scan|add/i })).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: 'Open the report form' })).toHaveAttribute(
      'href',
      '/report',
    );

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(aiOrWrite).toEqual([]);
  });
});
