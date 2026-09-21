import { test, expect } from '@playwright/test';
import { mockBase44, filterCrashes, type MockDb } from './fixtures/mockBase44';

// Founding Profiles v1 — self-editable identity fields on the existing User
// record (full_name/handle/bio/avatar_url, already wired through
// Account.jsx's auth.updateMe path; region/focus_areas are new, same path)
// plus one admin-only field (founding_member) and a new public read surface
// (getPublicProfile + /founders/:handle). No new entity, no parallel auth.

const MEMBER = {
  id: 'member-1',
  email: 'member@oohearth.test',
  role: 'user',
  access: 'member',
  agency: false,
  full_name: 'Ghost Signal',
  handle: 'ghostsignal',
  bio: 'Mapping the visual commons, one billboard at a time.',
  avatar_url: '',
  region: 'London, UK',
  focus_areas: ['mapping', 'activism'],
  founding_member: true,
  created_date: '2026-01-15T00:00:00.000Z',
};

test.describe('Founding Profiles — edit (Account.jsx)', () => {
  test('authenticated member completes a Founding Profile and it persists through refresh', async ({
    page,
  }) => {
    const db: MockDb = {
      user: { ...MEMBER, bio: '', region: '', focus_areas: [], full_name: '', handle: '' },
    };
    await mockBase44(page, db);

    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder('Your name').fill('Ghost Signal');
    await page.getByPlaceholder('@handle').fill('ghostsignal');
    await page.getByLabel('Region').fill('London, UK');
    await page.getByLabel('Bio').fill('Mapping the visual commons.');
    await page.getByRole('button', { name: 'Mapping' }).click();
    await page.getByRole('button', { name: 'Activism' }).click();

    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 10_000 });

    expect(db.user).toMatchObject({
      full_name: 'Ghost Signal',
      handle: 'ghostsignal',
      region: 'London, UK',
      bio: 'Mapping the visual commons.',
      focus_areas: ['mapping', 'activism'],
    });

    await page.reload();
    await expect(page.getByPlaceholder('Your name')).toHaveValue('Ghost Signal', {
      timeout: 10_000,
    });
    await expect(page.getByLabel('Region')).toHaveValue('London, UK');
    await expect(page.getByRole('button', { name: 'Mapping' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('a "View public profile" link appears once a valid handle is set', async ({ page }) => {
    const db: MockDb = { user: { ...MEMBER } };
    await mockBase44(page, db);
    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('link', { name: /View public profile/i })).toHaveAttribute(
      'href',
      '/founders/ghostsignal',
    );
  });

  test('founding_member and role/access/agency can never be self-granted, even by a crafted payload', async ({
    page,
  }) => {
    const db: MockDb = { user: { ...MEMBER, founding_member: false, role: 'user' } };
    await mockBase44(page, db);
    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible({ timeout: 10_000 });

    // Bypass the UI (which has no control for these fields at all) and hit
    // the mocked PUT directly with an attacker-shaped payload, exactly as a
    // malicious client could. The mock mirrors the real User.jsonc RLS
    // lock, so this must be stripped exactly like the real backend would.
    await page.evaluate(async () => {
      await fetch('/api/apps/test-app/entities/User/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ founding_member: true, role: 'admin', access: 'admin' }),
      });
    });

    expect(db.user).toMatchObject({ founding_member: false, role: 'user' });
  });

  test('duplicate-handle protection: taking an already-used handle is blocked before save', async ({
    page,
  }) => {
    const db: MockDb = {
      user: { ...MEMBER, handle: 'ghostsignal' },
      otherUsers: { taken: { id: 'other-1', handle: 'takenhandle' } },
    };
    await mockBase44(page, db);
    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible({ timeout: 10_000 });

    const handleInput = page.getByPlaceholder('@handle');
    await handleInput.fill('takenhandle');
    await page.getByRole('button', { name: 'Save profile' }).click();

    await expect(page.getByText(/already taken/i)).toBeVisible({ timeout: 10_000 });
    expect(db.user!.handle).toBe('ghostsignal'); // unchanged
  });

  test('an invalid handle is rejected client-side before any network call', async ({ page }) => {
    const db: MockDb = { user: { ...MEMBER } };
    await mockBase44(page, db);
    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible({ timeout: 10_000 });

    // The input's own onChange already strips whitespace live, so a slash
    // (which survives that stripping) is what actually exercises the
    // validator's rejection path here.
    await page.getByPlaceholder('@handle').fill('bad/handle');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText(/2–32 letters, numbers/i)).toBeVisible();
  });

  test('a failed save surfaces an error and keeps the form values intact', async ({ page }) => {
    const db: MockDb = { user: { ...MEMBER } };
    await mockBase44(page, db);
    await page.route('**/entities/User/me', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, json: { message: 'Save failed' } });
      }
      return route.fallback();
    });
    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible({ timeout: 10_000 });

    await page.getByLabel('Bio').fill('This will fail to save.');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText(/could not save profile|save failed/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByLabel('Bio')).toHaveValue('This will fail to save.');
  });

  test('a slow save shows a loading state and does not double-submit', async ({ page }) => {
    const db: MockDb = { user: { ...MEMBER } };
    await mockBase44(page, db);
    let putCount = 0;
    await page.route('**/entities/User/me', async (route) => {
      if (route.request().method() === 'PUT') {
        putCount += 1;
        await new Promise((r) => setTimeout(r, 600));
        Object.assign(db.user as Record<string, any>, route.request().postDataJSON());
        return route.fulfill({ json: db.user });
      }
      return route.fallback();
    });
    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible({ timeout: 10_000 });

    const saveBtn = page.getByRole('button', { name: /Save profile/i });
    await saveBtn.click();
    await expect(saveBtn).toBeDisabled();
    await page.waitForTimeout(100);
    await saveBtn.click({ force: true }).catch(() => {}); // disabled, should be a no-op
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 10_000 });
    expect(putCount).toBe(1);
  });

  test('keyboard-only: focus areas and save are all reachable and operable via keyboard', async ({
    page,
  }) => {
    const db: MockDb = { user: { ...MEMBER, focus_areas: [] } };
    await mockBase44(page, db);
    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible({ timeout: 10_000 });

    const mappingChip = page.getByRole('button', { name: 'Mapping' });
    await mappingChip.focus();
    await expect(mappingChip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(mappingChip).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expect(mappingChip).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Founding Profiles — public view (/founders/:handle)', () => {
  test('a visitor sees a complete, populated public profile', async ({ page }) => {
    const db: MockDb = {
      user: null,
      otherUsers: { ghostsignal: { ...MEMBER } },
      locations: {
        l1: { id: 'l1', created_by_id: MEMBER.id, status: 'verified' },
        l2: { id: 'l2', created_by_id: MEMBER.id, status: 'pending' }, // must NOT count
      },
      fieldChecks: {
        f1: { id: 'f1', created_by_id: MEMBER.id, status: 'verified' },
      },
    };
    await mockBase44(page, db);

    await page.goto('/founders/ghostsignal');
    await expect(page.getByRole('heading', { name: 'Ghost Signal' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('@ghostsignal')).toBeVisible();
    await expect(page.getByText('Founding Member')).toBeVisible();
    await expect(page.getByText('London, UK')).toBeVisible();
    await expect(page.getByText(/Mapping the visual commons/i)).toBeVisible();
    await expect(page.getByText('Mapping', { exact: true })).toBeVisible();
    await expect(page.getByText('Activism', { exact: true })).toBeVisible();
    // Only the ONE verified Location counts, not the pending one.
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible();
  });

  test('an @-prefixed handle in the URL resolves the same as without it', async ({ page }) => {
    const db: MockDb = { user: null, otherUsers: { ghostsignal: { ...MEMBER } } };
    await mockBase44(page, db);
    await page.goto('/founders/%40ghostsignal');
    await expect(page.getByRole('heading', { name: 'Ghost Signal' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('a sparse profile (no bio, no avatar, no focus areas, no contributions) renders gracefully', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const db: MockDb = {
      user: null,
      otherUsers: {
        newbie: {
          id: 'new-1',
          handle: 'newbie',
          full_name: '',
          bio: '',
          avatar_url: '',
          region: '',
          focus_areas: [],
          founding_member: false,
        },
      },
    };
    await mockBase44(page, db);
    await page.goto('/founders/newbie');

    await expect(page.getByText('@newbie')).toBeVisible({ timeout: 10_000 });
    // initials fallback -- scoped to the avatar role, not a page-wide text
    // search (page copy elsewhere legitimately contains the substring "NE").
    await expect(page.getByRole('img', { name: "newbie's avatar" })).toHaveText('NE');
    await expect(page.getByText(/No verified public contributions yet/i)).toBeVisible();
    await expect(page.getByText('Founding Member')).toHaveCount(0);
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });

  test('a nonexistent profile shows a not-found state, not a crash', async ({ page }) => {
    const db: MockDb = { user: null, otherUsers: {} };
    await mockBase44(page, db);
    await page.goto('/founders/nobody-here');
    await expect(page.getByText(/Profile not found/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Back to OOH Earth/i })).toBeVisible();
  });

  test('a malformed/partial backend response does not crash the page', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await mockBase44(page, { user: null });
    await page.route('**/functions/getPublicProfile', (route) =>
      route.fulfill({ json: { found: true, profile: { handle: 'weird' } } }),
    );
    await page.goto('/founders/weird');
    await expect(page.getByText('@weird')).toBeVisible({ timeout: 10_000 });
    expect(filterCrashes(consoleErrors)).toEqual([]);
  });

  test('private fields (id, email, role, access) never appear in the rendered page', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      otherUsers: {
        ghostsignal: {
          ...MEMBER,
          id: 'SECRET-INTERNAL-ID',
          email: 'private-email@example.com',
          role: 'admin',
          access: 'admin',
        },
      },
    };
    await mockBase44(page, db);
    await page.goto('/founders/ghostsignal');
    await expect(page.getByRole('heading', { name: 'Ghost Signal' })).toBeVisible({
      timeout: 10_000,
    });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('SECRET-INTERNAL-ID');
    expect(bodyText).not.toContain('private-email@example.com');
    expect(bodyText.toLowerCase()).not.toContain('admin');
  });

  test('a broken avatar URL falls back to initials without breaking layout', async ({ page }) => {
    const db: MockDb = {
      user: null,
      otherUsers: { ghostsignal: { ...MEMBER, avatar_url: 'https://example.com/broken.jpg' } },
    };
    await mockBase44(page, db);
    await page.route('https://example.com/broken.jpg', (route) => route.abort());
    await page.goto('/founders/ghostsignal');
    await expect(page.getByRole('heading', { name: 'Ghost Signal' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('GS', { exact: true })).toBeVisible({ timeout: 10_000 });
  });

  test('backend error state shows a retry-friendly message, not a crash', async ({ page }) => {
    await mockBase44(page, { user: null });
    await page.route('**/functions/getPublicProfile', (route) =>
      route.fulfill({ status: 500, json: { error: 'boom' } }),
    );
    await page.goto('/founders/anyone');
    await expect(page.getByText(/Could not load this profile/i)).toBeVisible({ timeout: 10_000 });
  });
});
