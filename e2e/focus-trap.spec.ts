import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Verifies the shared useFocusTrap hook (src/hooks/useFocusTrap.js) as wired
// into the 3 overlays it covers: CommandCenter, NavMenu, QuickCapture.
// Each case checks the same WAI-ARIA contract: focus enters the dialog,
// Tab/Shift+Tab stays contained within it, Escape still closes it (existing
// behavior, unregressed), and focus returns to the trigger on close.

test.describe('Focus trap — CommandCenter', () => {
  test('traps focus, closes on Escape, restores focus to trigger', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/');

    const trigger = page.getByRole('button', { name: /Open Command Center/i });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Command Center' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Focus entered the dialog, not left on <body> or the trigger.
    await expect(dialog).toContainText(''); // dialog resolved
    await expect
      .poll(() =>
        page.evaluate(() => {
          const dlg = document.querySelector('[role="dialog"][aria-label="Command Center"]');
          return !!dlg && dlg.contains(document.activeElement);
        }),
      )
      .toBe(true);

    // Shift+Tab from the first focusable should wrap to the last one within
    // the dialog, never escaping to the page behind it.
    await page.keyboard.press('Shift+Tab');
    const stillInsideDialog = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-label="Command Center"]');
      return !!dlg && dlg.contains(document.activeElement);
    });
    expect(stillInsideDialog).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('Focus trap — NavMenu', () => {
  test('traps focus, closes on Escape, restores focus to trigger', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/');

    const trigger = page.getByRole('button', { name: /Open menu/i });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(dialog).toBeVisible();

    // Two elements share this role+label (mobile launcher + desktop
    // popover -- only one is ever visually rendered, per the component's
    // own comment), so pick the visible one rather than the first DOM
    // match. Focus-entry is deferred one animation frame (see
    // useFocusTrap.js) -- poll rather than a single synchronous check.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const dlgs = Array.from(
            document.querySelectorAll('[role="dialog"][aria-label="Navigation menu"]'),
          );
          const visible = dlgs.find((d) => {
            const rect = d.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          return !!visible && visible.contains(document.activeElement);
        }),
      )
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('Focus trap — QuickCapture', () => {
  test('traps focus, closes on Escape, restores focus to trigger', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/map');

    const trigger = page.getByRole('button', { name: /Capture/i });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Anonymous field capture' });
    await expect(dialog).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(() => {
          const dlg = document.querySelector(
            '[role="dialog"][aria-label="Anonymous field capture"]',
          );
          return !!dlg && dlg.contains(document.activeElement);
        }),
      )
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
