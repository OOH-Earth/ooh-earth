import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Regression coverage for the sitewide label+hidden-input keyboard-dead-end
// pattern (see /trash's original fix, then CLAUDE_CONVERGENCE_STATE.md's
// "sitewide keyboard-inaccessible file-picker" entry). A `display:none`
// file input is removed from the tab order entirely -- clicking the wrapping
// label works with a mouse but there was previously no way to reach or
// activate it with a keyboard. useKeyboardFilePicker makes the label itself
// tab-stoppable and Enter/Space-activatable; the definitive proof is that a
// real `filechooser` event fires from a keyboard-only interaction, not just
// that the right ARIA attributes are present.
//
// /report is used here (public, no Lab-prototype gating) covering
// ReportStep1Document's two triggers -- the most severe case (no camera
// fallback at all, a genuine keyboard dead-end pre-fix).

test.describe('Keyboard-accessible file pickers', () => {
  test('ReportStep1Document: both photo triggers are keyboard-focusable and keyboard activation opens the native file chooser', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/report');

    const captureTrigger = page.getByRole('button', { name: 'Capture live' });
    const uploadTrigger = page.getByRole('button', { name: 'Upload' });

    await expect(captureTrigger).toBeVisible();
    await expect(uploadTrigger).toBeVisible();

    // Enter on the focused label triggers the hidden input's click(),
    // which opens the OS file chooser -- Playwright surfaces that as a
    // real `filechooser` event, the only reliable proof this isn't just a
    // decorative aria-label with no functional keyboard path behind it.
    await captureTrigger.focus();
    await expect(captureTrigger).toBeFocused();
    const chooser1 = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    await (
      await chooser1
    ).setFiles({
      name: 'keyboard-capture.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      ),
    });

    // A native chooser remains active until a real file is selected. Reload
    // for an independent Space-key assertion rather than racing a second
    // chooser against the first browser dialog.
    await page.reload();
    await expect(uploadTrigger).toBeVisible();
    await uploadTrigger.focus();
    await expect(uploadTrigger).toBeFocused();
    const chooser2 = page.waitForEvent('filechooser');
    await page.keyboard.press('Space');
    await (
      await chooser2
    ).setFiles({
      name: 'keyboard-upload.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  });
});
