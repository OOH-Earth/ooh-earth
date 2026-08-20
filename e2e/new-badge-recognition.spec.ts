import { test, expect, type Page } from '@playwright/test';
import { mockBase44, ADMIN_USER } from './fixtures/mockBase44';

// "New since your last visit" on /operative (useNewBadgeRecognition.js +
// NewBadgeRecognition.jsx) recognizes a badge that became earned since the
// user was last on this page -- not only crossings caused by the current
// /report submission (FieldReport's separate, unrelated newlyUnlocked).
// Uses a per-user localStorage snapshot of previously-seen earned badge
// ids -- no new entity, no backend, no second Location fetch; diffs
// against the same `earnedBadges` useGamification already computes live.

const SEEN_KEY = `ooh-seen-badges-${ADMIN_USER.id}`;

function banner(page: Page) {
  return page.locator('[role="status"]');
}

function locationsWithReports(count: number) {
  const locations: Record<string, unknown> = {};
  for (let i = 1; i <= count; i++) {
    locations[`loc-${i}`] = { id: `loc-${i}`, created_by_id: ADMIN_USER.id, status: 'pending' };
  }
  return locations;
}

test.describe('OperativeProfile — New badge recognition', () => {
  test('first-ever visit establishes a silent baseline; existing earned badges are never shown as "new"', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: locationsWithReports(1) });
    // No localStorage seeded at all -- genuinely first visit for this user
    // on this browser. first_blood (>=1 report) is already earned.
    await page.goto('/operative?access_token=mock-admin-token');

    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(banner(page)).toHaveCount(0);

    // Baseline was actually written, not just silently skipped.
    const stored = await page.evaluate((key) => localStorage.getItem(key), SEEN_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toContain('first_blood');
  });

  test('a returning visit with no change since the stored baseline shows nothing new', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: locationsWithReports(1) });
    await page.addInitScript(
      ([key, ids]) => localStorage.setItem(key, JSON.stringify(ids)),
      [SEEN_KEY, ['first_blood']],
    );
    await page.goto('/operative?access_token=mock-admin-token');

    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(banner(page)).toHaveCount(0);
  });

  test('a genuinely newly-earned badge is recognized once, then not shown again on a later visit', async ({
    page,
  }) => {
    await mockBase44(page, { user: ADMIN_USER, locations: locationsWithReports(1) });
    // Stored snapshot exists (a real prior visit) but recorded zero earned
    // badges -- first_blood is earned now, so it's genuinely new.
    await page.addInitScript(
      ([key, ids]) => localStorage.setItem(key, JSON.stringify(ids)),
      [SEEN_KEY, []],
    );
    await page.goto('/operative?access_token=mock-admin-token');

    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });
    const b = banner(page);
    await expect(b).toBeVisible();
    await expect(b.getByText('New since your last visit')).toBeVisible();
    await expect(b.getByText('First Report', { exact: true })).toBeVisible();

    // Merit Badges grid itself is unaffected by the new banner existing.
    await expect(page.getByText('1 / 19 earned')).toBeVisible();

    // The snapshot must have already advanced past this badge so a later
    // visit (which would read this exact stored value) does not recognize
    // it again -- proven directly rather than via page.reload(), since
    // reload re-runs addInitScript and would re-seed the snapshot back to
    // [], masking the very thing this assertion checks.
    const stored = await page.evaluate((key) => localStorage.getItem(key), SEEN_KEY);
    expect(JSON.parse(stored as string)).toEqual(['first_blood']);
  });

  test('multiple newly-earned badges are all recognized together', async ({ page }) => {
    // 10 reports -> both first_blood (>=1) and spotter (>=10) are earned.
    await mockBase44(page, { user: ADMIN_USER, locations: locationsWithReports(10) });
    await page.addInitScript(
      ([key, ids]) => localStorage.setItem(key, JSON.stringify(ids)),
      [SEEN_KEY, []],
    );
    await page.goto('/operative?access_token=mock-admin-token');

    const b = banner(page);
    await expect(b).toBeVisible({ timeout: 20_000 });
    await expect(b.getByText('2 new milestones')).toBeVisible();
    await expect(b.getByText('First Report', { exact: true })).toBeVisible();
    await expect(b.getByText('Spotter', { exact: true })).toBeVisible();
  });

  test('anonymous visitors never see personal badge recognition', async ({ page }) => {
    await mockBase44(page, { user: null, locations: {} });
    await page.goto('/operative');

    await expect(page.getByText(/Authentication Required/i)).toBeVisible({ timeout: 20_000 });
    await expect(banner(page)).toHaveCount(0);
  });

  test('localStorage unavailable: the rest of the page still works, just without recognition', async ({
    page,
  }) => {
    // Scoped storage failure: only this feature's own key throws, every
    // other key (theme, app-bootstrap params, etc.) behaves normally. This
    // isolates "does useNewBadgeRecognition degrade gracefully" from
    // pre-existing, unrelated localStorage usage elsewhere in the app that
    // isn't part of this change (e.g. the app's own ?access_token=
    // bootstrap reads/writes localStorage unguarded before React ever
    // mounts -- unconditionally blocking ALL localStorage access blanks
    // the entire page before it can render, which isn't what "this one
    // feature fails silently" is supposed to simulate).
    await page.addInitScript((key) => {
      const realGetItem = window.localStorage.getItem.bind(window.localStorage);
      const realSetItem = window.localStorage.setItem.bind(window.localStorage);
      Object.defineProperty(window.localStorage, 'getItem', {
        value: (k: string) => {
          if (k === key) throw new Error('localStorage blocked');
          return realGetItem(k);
        },
      });
      Object.defineProperty(window.localStorage, 'setItem', {
        value: (k: string, v: string) => {
          if (k === key) throw new Error('localStorage blocked');
          return realSetItem(k, v);
        },
      });
    }, SEEN_KEY);
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await mockBase44(page, { user: ADMIN_USER, locations: locationsWithReports(1) });
    await page.goto('/operative?access_token=mock-admin-token');

    // The rest of the profile renders normally -- badge recognition being
    // unavailable doesn't take down the page.
    await expect(page.getByRole('heading', { name: 'Merit Badges' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('1 / 19 earned')).toBeVisible();
    await expect(banner(page)).toHaveCount(0);

    const crashes = errors.filter(
      (e) =>
        /Uncaught|ReferenceError|is not a function|is not defined/i.test(e) &&
        !/localStorage/i.test(e),
    );
    expect(crashes, crashes.join('\n')).toEqual([]);
  });
});
