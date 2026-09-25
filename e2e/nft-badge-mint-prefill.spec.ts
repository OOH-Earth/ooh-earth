import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER } from './fixtures/mockBase44';

// Merit badges earned on /profile (useGamification) and the NFT trading-card
// studio at /lab/nft (NftCreator) were previously two disconnected systems --
// a user's real, earned trophies had no path into the one place OOH Earth
// lets them "display" a trophy as a collectible. An earned badge now links to
// /lab/nft?badge=<id>, which prefills the slab's title/grade/label from that
// badge's real tier -- no on-chain behavior changes, no new entity/schema.

test.describe('NftCreator — prefilled from an earned merit badge', () => {
  test('title, grade and banner reflect the linked badge', async ({ page }) => {
    // /lab/nft is gated by LabAccessRoute -- see nft-creator-ux.spec.ts for
    // why both the mocked user and access_token are required together.
    await mockBase44(page, { user: ADMIN_USER });
    await page.goto('/lab/nft?access_token=mock-admin-token&badge=mint_pioneer');

    // The 3D slab viewer's WebGL bundle is heavy; wait for the page to be
    // settled before asserting on the studio panel next to it.
    await expect(page.getByRole('heading', { name: 'NFT Creator' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Prefilled from your earned badge.*Mint Pioneer/i)).toBeVisible();
    await expect(page.getByPlaceholder('Subvertising title')).toHaveValue('Mint Pioneer', {
      timeout: 20_000,
    });
    // mint_pioneer is a 'gold' badge -> TIER_TO_SLAB maps it to grade 9.5
    await expect(page.locator('select').first()).toHaveValue('9.5');
  });

  test('an unknown/missing badge id leaves the default config untouched', async ({ page }) => {
    await mockBase44(page, { user: ADMIN_USER });
    await page.goto('/lab/nft?access_token=mock-admin-token&badge=does-not-exist');

    await expect(page.getByRole('heading', { name: 'NFT Creator' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Prefilled from your earned badge/i)).toHaveCount(0);
    await expect(page.getByPlaceholder('Subvertising title')).toHaveValue('Clean City', {
      timeout: 20_000,
    });
  });

  // Collector milestone badges (brand_explorer, added by the collector-badge
  // domino) are just more BADGES entries -- this proves the existing
  // deep-link/prefill mechanism above needed zero NftCreator.jsx changes to
  // support them.
  test('a collector badge (Brand Explorer) prefills the same way as any other badge', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER });
    await page.goto('/lab/nft?access_token=mock-admin-token&badge=brand_explorer');

    await expect(page.getByRole('heading', { name: 'NFT Creator' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/Prefilled from your earned badge.*Brand Explorer/i)).toBeVisible();
    await expect(page.getByPlaceholder('Subvertising title')).toHaveValue('Brand Explorer', {
      timeout: 20_000,
    });
    // brand_explorer is a 'bronze' badge -> TIER_TO_SLAB maps it to grade 7
    await expect(page.locator('select').first()).toHaveValue('7');
  });
});

test.describe('BadgeGrid — an earned badge offers a way to mint it', () => {
  test('earned badge shows "Mint as NFT" linking to /lab/nft?badge=<id>; a locked one does not', async ({
    page,
  }) => {
    await mockBase44(page, {
      user: ADMIN_USER,
      locations: {
        'loc-1': {
          id: 'loc-1',
          created_by_id: ADMIN_USER.id,
          status: 'verified',
          title: 'Test Billboard',
        },
      },
    });
    await page.goto('/operative?access_token=mock-admin-token');

    // 'first_blood' (>=1 report) is earned by the single seeded location.
    const earned = page.locator('text=First Report').locator('..');
    const mintLink = earned.getByRole('link', { name: /mint as nft/i });
    await expect(mintLink).toHaveAttribute('href', '/lab/nft?badge=first_blood', {
      timeout: 20_000,
    });

    // 'surveyor' needs 100 reports -- stays locked, so no mint link renders
    // for it at all (can't mint a trophy you haven't earned).
    const locked = page.locator('text=Surveyor').locator('..');
    await expect(locked.getByRole('link', { name: /mint as nft/i })).toHaveCount(0);
  });
});
