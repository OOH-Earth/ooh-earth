import { test, expect } from '@playwright/test';
import { mockBase44, ADMIN_USER } from './fixtures/mockBase44';

// NftCreator.jsx's "AI Generate" previously had a silent catch block --
// on failure the button just stopped spinning with zero user feedback.
// It now surfaces a user-facing error. Separately, "Mint on Zora" was a
// plain <Link to="/zora"> with no relationship to the artwork just built --
// /zora is a display-only market page with no mechanism to receive it, so
// the label was misleading. It's now "View Zora Markets", matching what
// the destination actually is.

test.describe('NftCreator — AI Generate failure is no longer silent', () => {
  test('shows an error message when GenerateImage fails', async ({ page }) => {
    // /lab/nft is gated by LabAccessRoute, which defaults to 'restricted'
    // (the mocked LabPrototype.filter call returns an empty list -- see
    // fixtures/mockBase44.ts's generic fallback) and only opens for an
    // authenticated account when no investor token is present.
    await mockBase44(page, { user: ADMIN_USER });
    // GenerateImage is invoked via base44.integrations.Core.GenerateImage,
    // which the generic mock fixture answers with a benign {ok:true} (no
    // `url` key) for any non-entity call -- exactly the "no image" failure
    // path this fix covers, with no extra route override needed.

    // access_token in the URL is what actually makes AuthContext's initial
    // checkAppState() call checkUserAuth() at all in this mocked sandbox
    // (see e2e/verify-reject-workflow.spec.ts) -- without it, appParams.token
    // is falsy and isAuthenticated never resolves true regardless of the
    // mocked user, so LabAccessRoute always redirects to /login.
    await page.goto('/lab/nft?access_token=mock-admin-token');
    const generateBtn = page.getByRole('button', { name: /AI Generate/i });
    await generateBtn.click();

    await expect(page.getByText(/Generation returned no image|generation failed/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe('NftCreator — Zora link is honestly labeled', () => {
  test('does not claim to mint the artwork it links to a display-only market page', async ({
    page,
  }) => {
    // /lab/nft is gated by LabAccessRoute, which defaults to 'restricted'
    // (the mocked LabPrototype.filter call returns an empty list -- see
    // fixtures/mockBase44.ts's generic fallback) and only opens for an
    // authenticated account when no investor token is present.
    await mockBase44(page, { user: ADMIN_USER });
    // access_token in the URL is what actually makes AuthContext's initial
    // checkAppState() call checkUserAuth() at all in this mocked sandbox
    // (see e2e/verify-reject-workflow.spec.ts) -- without it, appParams.token
    // is falsy and isAuthenticated never resolves true regardless of the
    // mocked user, so LabAccessRoute always redirects to /login.
    await page.goto('/lab/nft?access_token=mock-admin-token');

    const zoraLink = page.getByRole('link', { name: /View Zora Markets/i });
    await zoraLink.scrollIntoViewIfNeeded();
    await expect(zoraLink).toBeVisible();
    await expect(page.getByRole('link', { name: /^Mint on Zora$/i })).toHaveCount(0);
  });
});
