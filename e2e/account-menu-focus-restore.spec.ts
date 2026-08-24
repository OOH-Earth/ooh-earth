import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// AccountMenu (src/components/ooh/AccountMenu.jsx) is a nav dropdown, not a
// modal dialog -- it deliberately does NOT adopt useFocusTrap's role="dialog"
// aria-modal="true" (that would incorrectly tell screen readers the whole
// page became inert for what's a small anchored menu). The real, narrower
// defect this covers: closing via Escape previously never returned focus to
// the trigger, so a keyboard user lost their position entirely (focus fell
// back to document.body).
//
// Deliberately asymmetric with outside-click: Escape has no other focus
// target, so it must return focus to the trigger. An outside click already
// has its own target (whatever was clicked) -- stealing focus back to the
// trigger there would fight the interaction the user was actually making,
// so that case just closes the menu and leaves the browser's normal click
// focus behavior alone.

test.describe('AccountMenu — focus restoration on close', () => {
  test('Escape closes the guest panel and returns focus to the trigger', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.goto('/');

    const trigger = page.getByRole('button', { name: 'Account' });
    await trigger.click();
    await expect(page.getByText('Guest access')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('Guest access')).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('an outside click closes the guest panel without stealing focus back to the trigger', async ({
    page,
  }) => {
    await mockBase44(page, { user: null });
    await page.goto('/');

    const trigger = page.getByRole('button', { name: 'Account' });
    await trigger.click();
    await expect(page.getByText('Guest access')).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(page.getByText('Guest access')).toBeHidden();
    await expect(trigger).not.toBeFocused();
  });
});
