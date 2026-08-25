import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Regression coverage for the sitewide label+hidden-input keyboard-dead-end
// pattern (see /trash's original fix, then CLAUDE_CONVERGENCE_STATE.md's
// "sitewide keyboard-inaccessible file-picker" entry). A `display:none`
// file input is removed from the tab order entirely -- clicking the wrapping
// label works with a mouse but there was previously no way to reach or
// activate it with a keyboard. useKeyboardFilePicker makes the label itself
// tab-stoppable and Enter/Space-activatable. Chromium's native file chooser
// event is not deterministic in headless mode, so this test observes the
// hidden-input click invoked by the keyboard handler instead of waiting on
// the OS dialog.
//
// /report is used here (public, no Lab-prototype gating) covering
// ReportStep1Document's two triggers -- the most severe case (no camera
// fallback at all, a genuine keyboard dead-end pre-fix).

test.describe('Keyboard-accessible file pickers', () => {
  test('ReportStep1Document: both photo triggers are keyboard-focusable and activate their file inputs', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.addInitScript(() => {
      window.__keyboardFilePickerClicks = [];
      const nativeClick = HTMLInputElement.prototype.click;
      HTMLInputElement.prototype.click = function () {
        if (this.type === 'file') {
          window.__keyboardFilePickerClicks.push({ capture: this.getAttribute('capture') });
          return;
        }
        nativeClick.call(this);
      };
    });
    await page.goto('/report');

    const captureTrigger = page.getByRole('button', { name: 'Capture live' });
    const uploadTrigger = page.getByRole('button', { name: 'Upload' });

    await expect(captureTrigger).toBeVisible();
    await expect(uploadTrigger).toBeVisible();

    // Enter on the focused label triggers the hidden input's click().
    await captureTrigger.focus();
    await expect(captureTrigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect
      .poll(() => page.evaluate(() => window.__keyboardFilePickerClicks))
      .toContainEqual({ capture: 'environment' });
    // Reload for an independent Space-key assertion.
    await page.reload();
    await expect(uploadTrigger).toBeVisible();
    await uploadTrigger.focus();
    await expect(uploadTrigger).toBeFocused();
    await page.keyboard.press('Space');
    await expect
      .poll(() => page.evaluate(() => window.__keyboardFilePickerClicks))
      .toContainEqual({ capture: null });
  });
});
