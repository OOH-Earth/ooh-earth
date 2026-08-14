import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Verifies useFocusTrap (src/hooks/useFocusTrap.js) as adopted by UnitFinder
// (src/components/ooh/UnitFinder.jsx) -- same WAI-ARIA contract already
// covered for CommandCenter/NavMenu/QuickCapture in focus-trap.spec.ts.
// Desktop-only: the "Find units" trigger is `hidden md:flex` by design (a
// desktop toolbar action), so there's no mobile-viewport behavior to test --
// matches how smoke.spec.ts/a11y.spec.ts are also desktop-only-baselined
// (see playwright.config.ts's mobile-chromium testMatch comment).

test.describe('Focus trap — UnitFinder', () => {
  test('traps focus, closes on Escape, restores focus to trigger', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/map');

    const trigger = page.getByRole('button', { name: 'Find units' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'AI Unit Finder' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    const activeInsideDialog = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-label="AI Unit Finder"]');
      return !!dlg && dlg.contains(document.activeElement);
    });
    expect(activeInsideDialog).toBe(true);

    // Shift+Tab from the first focusable should wrap to the last one within
    // the dialog, never escaping to the map behind it.
    await page.keyboard.press('Shift+Tab');
    const stillInsideDialog = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"][aria-label="AI Unit Finder"]');
      return !!dlg && dlg.contains(document.activeElement);
    });
    expect(stillInsideDialog).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
