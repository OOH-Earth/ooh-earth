import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// CommandCenter's outer wrapper carries `pointer-events-none` whenever
// `open` is false, and GraffitiCamera was rendered as its DOM *child*.
// `handleAction('graffiti')` calls onClose() and setGraffitiCam(true) in the
// same handler, so GraffitiCamera opens in the exact render where its
// ancestor is already pointer-events-none -- which cascades to every
// descendant regardless of that descendant's own z-index. Confirmed live:
// elementFromPoint at GraffitiCamera's own close button resolved to an
// unrelated Nav element behind it, not the button. Fixed by hoisting
// GraffitiCamera to a sibling of the wrapper (a Fragment at the top level)
// instead of a descendant, plus bringing the wrapper's z-index in line with
// QuickCapture/NavMenu's full-screen-modal convention (z-[2000], clearing
// MobileBottomTabs' z-[1000]) for CommandCenter's own content while open.

test.describe('CommandCenter — GraffitiCamera stays interactive after opening', () => {
  test('close button and camera controls are clickable, not trapped by the closed CommandCenter wrapper', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/');

    await page.getByRole('banner').getByRole('button', { name: 'Command', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Command Center' })).toBeVisible();

    await page.getByText('Graffiti Camera', { exact: true }).click();

    // GraffitiCamera has no role="dialog" of its own -- assert on content
    // only it renders, then prove the close button is really reachable.
    await expect(page.getByText('Graffiti field camera')).toBeVisible();
    const closeBtn = page.getByRole('button', { name: 'Close' });
    await expect(closeBtn).toBeVisible();

    // The decisive check: a real click succeeds (Playwright's actionability
    // check fails loudly -- "intercepts pointer events" -- if anything sits
    // on top, exactly what happened before this fix).
    await closeBtn.click({ timeout: 3000 });
    await expect(page.getByText('Graffiti field camera')).toBeHidden();
  });
});
