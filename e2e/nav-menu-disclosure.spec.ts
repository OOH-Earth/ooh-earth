import { test, expect } from '@playwright/test';
import { mockBase44 } from './fixtures/mockBase44';

// Covers the Tools-first IA redesign of NavMenu.jsx: primary groups (Tools,
// Campaigns) start expanded so the first thing a user sees is what they can
// do, while secondary groups (e.g. Ecosystem) start collapsed and only
// render their items once toggled open. Runs at both desktop and mobile
// viewports (see playwright.config.ts) since only one of NavMenu's two
// mounted panels is ever visible per breakpoint.

test.describe('NavMenu — progressive disclosure', () => {
  test('primary groups are open by default; secondary groups expand/collapse on click', async ({
    page,
  }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/');

    await page.getByRole('button', { name: /Open menu/i }).click();

    // Only one of the mobile/desktop panels is ever visually rendered at a
    // given viewport (see NavMenu.jsx) — scope every query to that one.
    const dialog = page.locator('[role="dialog"][aria-label="Navigation menu"]:visible');
    await expect(dialog).toBeVisible();

    const toolsToggle = dialog.getByRole('button', { name: /Tools/i });
    const ecosystemToggle = dialog.getByRole('button', { name: /Ecosystem/i });

    await expect(toolsToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(ecosystemToggle).toHaveAttribute('aria-expanded', 'false');

    // Tools is primary — its items render without any interaction.
    await expect(dialog.getByRole('link', { name: 'Field Report' })).toBeVisible();

    // Ecosystem is secondary and nests Capital/Agency/Reference subgroups —
    // their items shouldn't exist in the accessibility tree until expanded.
    const investorHub = dialog.getByRole('link', { name: 'Investor Hub' });
    await expect(investorHub).toBeHidden();

    await ecosystemToggle.click();
    await expect(ecosystemToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(investorHub).toBeVisible();

    await ecosystemToggle.click();
    await expect(ecosystemToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(investorHub).toBeHidden();
  });
});
