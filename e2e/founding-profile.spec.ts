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
  profile_public: true,
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

  test('a member with a complete profile but no explicit opt-in shows "private" and no public link', async ({
    page,
  }) => {
    const db: MockDb = { user: { ...MEMBER, profile_public: false } };
    await mockBase44(page, db);
    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole('link', { name: /View public profile/i })).toHaveCount(0);
    await expect(page.getByText(/Your profile is private/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Public Founding Profile/ })).toBeVisible();
  });

  test('explicit publish then unpublish round-trips through the visibility toggle', async ({
    page,
  }) => {
    const db: MockDb = { user: { ...MEMBER, profile_public: false } };
    await mockBase44(page, db);
    await page.goto('/account?access_token=mock-member-token');
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible({ timeout: 10_000 });

    const toggle = page.getByRole('button', { name: /Public Founding Profile/ });
    await toggle.click();
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 10_000 });
    expect(db.user!.profile_public).toBe(true);
    await expect(page.getByRole('link', { name: /View public profile/i })).toBeVisible();

    await toggle.click();
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 10_000 });
    expect(db.user!.profile_public).toBe(false);
    await expect(page.getByRole('link', { name: /View public profile/i })).toHaveCount(0);
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
  test('a handle that exists but was never made public is indistinguishable from nonexistent', async ({
    page,
  }) => {
    const db: MockDb = {
      user: null,
      otherUsers: { ghostsignal: { ...MEMBER, profile_public: false } },
    };
    await mockBase44(page, db);
    await page.goto('/founders/ghostsignal');
    await expect(page.getByText(/Profile not found/i)).toBeVisible({ timeout: 10_000 });
    // No leak whatsoever of the private profile's content.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Mapping the visual commons');
    expect(bodyText).not.toContain('London, UK');
  });

  test('a profile that is unpublished after being public stops being publicly retrievable', async ({
    page,
  }) => {
    const db: MockDb = { user: null, otherUsers: { ghostsignal: { ...MEMBER } } };
    await mockBase44(page, db);
    await page.goto('/founders/ghostsignal');
    await expect(page.getByRole('heading', { name: 'Ghost Signal' })).toBeVisible({
      timeout: 10_000,
    });

    // The owner unpublishes (server-side truth is what matters here, not UI).
    (db.otherUsers!.ghostsignal as Record<string, any>).profile_public = false;

    await page.reload();
    await expect(page.getByText(/Profile not found/i)).toBeVisible({ timeout: 10_000 });
  });

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
          profile_public: true,
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

// SOCIAL-2 — Field Record: a public profile's recent verified places, each
// linking to its public Location Detail page. Verified-only, capped, and a
// contribution record rather than a movement history.
test.describe('Founding Profiles — Field Record', () => {
  const place = (n: number, extra: Record<string, unknown> = {}) => ({
    id: `fr-${n}`,
    title: `Field Place ${n}`,
    type: 'mural',
    status: 'verified',
    created_by_id: MEMBER.id,
    created_date: `2026-05-${String(10 + n).padStart(2, '0')}T12:34:56.000Z`,
    lat: 51.5,
    lng: -0.12,
    address: 'PRIVATE-ADDRESS-STRING',
    ...extra,
  });

  test('lists recent verified places newest first, and only verified ones', async ({ page }) => {
    const db: MockDb = {
      user: null,
      otherUsers: { ghostsignal: { ...MEMBER } },
      locations: {
        a: place(1),
        b: place(2, { type: 'billboard' }),
        c: place(3, { status: 'pending', title: 'PENDING-PLACE' }),
        d: place(4, { status: 'rejected', title: 'REJECTED-PLACE' }),
        e: place(5, { created_by_id: 'someone-else', title: 'OTHER-USERS-PLACE' }),
      },
    };
    await mockBase44(page, db);
    const responses: string[] = [];
    page.on('response', async (res) => {
      if (res.url().includes('/functions/getPublicProfile')) responses.push(await res.text());
    });
    await page.goto('/founders/ghostsignal');

    const section = page.getByRole('region', { name: /Field record/i });
    await expect(section).toBeVisible({ timeout: 10_000 });
    const links = section.getByRole('link');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute('href', '/location/fr-2');
    await expect(links.nth(0)).toContainText('Field Place 2');
    await expect(links.nth(0)).toContainText('Billboard');
    await expect(links.nth(0)).toContainText('12 MAY 2026');
    await expect(links.nth(1)).toHaveAttribute('href', '/location/fr-1');

    const text = await page.locator('body').innerText();
    for (const s of ['PENDING-PLACE', 'REJECTED-PLACE', 'OTHER-USERS-PLACE']) {
      expect(text).not.toContain(s);
    }
    // The response itself carries only the allowlisted place fields.
    const raw = responses.join('\n');
    expect(raw).not.toContain('PRIVATE-ADDRESS-STRING');
    expect(raw).not.toContain('"lat"');
    expect(raw).not.toContain('created_by_id');
    expect(raw).not.toContain('12:34:56');
  });

  test('is capped at five records', async ({ page }) => {
    const locations: Record<string, any> = {};
    for (let n = 1; n <= 8; n++) locations[`p${n}`] = place(n);
    await mockBase44(page, { user: null, otherUsers: { ghostsignal: { ...MEMBER } }, locations });
    await page.goto('/founders/ghostsignal');
    const section = page.getByRole('region', { name: /Field record/i });
    await expect(section.getByRole('link')).toHaveCount(5, { timeout: 10_000 });
    await expect(section.getByRole('link').first()).toHaveAttribute('href', '/location/fr-8');
  });

  test('shows an honest empty state when there are no verified places', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      otherUsers: { ghostsignal: { ...MEMBER } },
      locations: { x: place(1, { status: 'pending' }) },
    });
    await page.goto('/founders/ghostsignal');
    const section = page.getByRole('region', { name: /Field record/i });
    await expect(section).toContainText('No verified field records yet.', { timeout: 10_000 });
    await expect(section.getByRole('link')).toHaveCount(0);
  });

  test('a private profile renders no field record at all', async ({ page }) => {
    await mockBase44(page, {
      user: null,
      otherUsers: { ghostsignal: { ...MEMBER, profile_public: false } },
      locations: { a: place(1, { title: 'SHOULD-NOT-RENDER' }) },
    });
    await page.goto('/founders/ghostsignal');
    await expect(page.getByText('Profile not found')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('region', { name: /Field record/i })).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain('SHOULD-NOT-RENDER');
  });

  test('malformed records are dropped or defaulted without crashing', async ({ page }) => {
    await mockBase44(page, { user: null, otherUsers: { ghostsignal: { ...MEMBER } } });
    await page.route('**/functions/getPublicProfile', (route) =>
      route.fulfill({
        json: {
          found: true,
          profile: { handle: 'ghostsignal', full_name: 'Ghost Signal' },
          contributions: { verified_reports: 1, verified_rechecks: 0 },
          recent_verified_places: [
            { id: '../../admin', title: 'Bad id' },
            null,
            { id: 'ok-1', title: '', type: 'spaceship', created_date: 'nope' },
          ],
        },
      }),
    );
    await page.goto('/founders/ghostsignal');
    const section = page.getByRole('region', { name: /Field record/i });
    await expect(section.getByRole('link')).toHaveCount(1, { timeout: 10_000 });
    await expect(section.getByRole('link')).toHaveAttribute('href', '/location/ok-1');
    await expect(section).toContainText('Untitled place');
    await expect(section).not.toContainText('Bad id');
  });

  test('keyboard: a record is reachable by Tab and opens Location Detail on Enter', async ({
    page,
  }) => {
    await mockBase44(page, {
      user: null,
      otherUsers: { ghostsignal: { ...MEMBER } },
      locations: { a: place(1) },
    });
    await page.goto('/founders/ghostsignal');
    const link = page.getByRole('region', { name: /Field record/i }).getByRole('link');
    await expect(link).toHaveCount(1, { timeout: 10_000 });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/location\/fr-1$/);
    await expect(page.getByText('Field Place 1').first()).toBeVisible({ timeout: 10_000 });
  });
});
