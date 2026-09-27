import { test, expect } from '@playwright/test';
import { mockBase44, type MockDb } from './fixtures/mockBase44';

// SOCIAL-3 — Mission Board: the existing Quest engine (QUESTS + claimQuest +
// QuestCompletion) presented as real-world missions. Periods are UTC and
// shared with the server, so the board never offers a claim the server
// would refuse. Time is pinned with page.clock and the mock's serverNow.

const OP = { id: 'op-1', email: 'op@oohearth.test', role: 'user', full_name: 'Field Op' };

// Base44 timestamps carry no offset.
const b44 = (iso: string) => new Date(iso).toISOString().replace('Z', '000');

function loc(id: string, created: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    title: id,
    type: 'billboard',
    status: 'pending',
    created_by_id: OP.id,
    created_date: b44(created),
    ...extra,
  };
}

async function openBoard(page: import('@playwright/test').Page, db: MockDb, at: string) {
  await page.clock.setFixedTime(new Date(at));
  db.serverNow = at;
  await mockBase44(page, db);
  await page.goto('/operative?access_token=mock-op-token');
  const board = page.locator('#missions');
  await expect(board.getByRole('heading', { name: 'Mission Board' })).toBeVisible({
    timeout: 15_000,
  });
  return board;
}

const mission = (board: import('@playwright/test').Locator, id: string) =>
  board.getByTestId(`mission-${id}`);

test.describe('Mission Board', () => {
  test('anonymous visitors see a login prompt and no claim is ever attempted', async ({ page }) => {
    const claims: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/functions/claimQuest')) claims.push(r.url());
    });
    await mockBase44(page, { user: null });
    await page.goto('/operative');
    await expect(page.getByText(/Log in to view your progress/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('#missions')).toHaveCount(0);
    expect(claims).toEqual([]);
  });

  test('shows each real state, claims through the server, then shows Claimed', async ({ page }) => {
    const db: MockDb = {
      user: OP,
      locations: {
        a: loc('a', '2026-09-30T09:00:00Z', { image_url: 'https://example.com/a.jpg' }),
        b: loc('b', '2026-09-28T09:00:00Z'),
      },
    };
    const board = await openBoard(page, db, '2026-09-30T12:00:00Z');

    await expect(mission(board, 'daily_report')).toHaveAttribute('data-state', 'completed');
    await expect(mission(board, 'daily_photo')).toHaveAttribute('data-state', 'completed');
    await expect(mission(board, 'weekly_reports')).toHaveAttribute('data-state', 'in_progress');
    await expect(mission(board, 'weekly_reports')).toContainText('2/5');
    await expect(mission(board, 'weekly_busts')).toHaveAttribute('data-state', 'available');
    await expect(board.getByRole('progressbar').first()).toHaveAttribute('aria-valuemax', '1');

    const req = page.waitForRequest('**/functions/claimQuest');
    await mission(board, 'daily_report')
      .getByRole('button', { name: /Claim \+50 XP/ })
      .click();
    const body = (await req).postDataJSON();
    expect(body).toEqual({ quest_id: 'daily_report' }); // XP is never client-supplied

    await expect(mission(board, 'daily_report')).toContainText('+50 XP banked.');
    await expect(mission(board, 'daily_report')).toHaveAttribute('data-state', 'claimed');
    await expect(mission(board, 'daily_report').getByRole('button')).toHaveCount(0);
    expect(Object.values(db.questCompletions ?? {})).toHaveLength(1);
  });

  test('a claim earlier this UTC period shows Claimed; a stale colliding key does not', async ({
    page,
  }) => {
    const db: MockDb = {
      user: OP,
      locations: { a: loc('a', '2026-09-30T09:00:00Z') },
      questCompletions: {
        today: {
          id: 'today',
          quest_id: 'daily_report',
          period_key: '2026-09-30',
          created_by_id: OP.id,
          created_date: b44('2026-09-30T10:00:00Z'),
        },
        // Old week formula: key "2026-W40" minted on Sat 26 Sep (ISO W39).
        stale: {
          id: 'stale',
          quest_id: 'weekly_reports',
          period_key: '2026-W40',
          created_by_id: OP.id,
          created_date: b44('2026-09-26T10:00:00Z'),
        },
        theirs: {
          id: 'theirs',
          quest_id: 'daily_photo',
          period_key: '2026-09-30',
          created_by_id: 'someone-else',
          created_date: b44('2026-09-30T08:00:00Z'),
        },
      },
    };
    const qcRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/entities/QuestCompletion'))
        qcRequests.push(decodeURIComponent(r.url()));
    });
    const board = await openBoard(page, db, '2026-09-30T12:00:00Z');

    await expect(mission(board, 'daily_report')).toHaveAttribute('data-state', 'claimed');
    await expect(mission(board, 'weekly_reports')).not.toHaveAttribute('data-state', 'claimed');
    await expect(mission(board, 'daily_photo')).not.toHaveAttribute('data-state', 'claimed');
    // Only the caller's own completions are requested.
    expect(qcRequests.length).toBeGreaterThan(0);
    for (const u of qcRequests) expect(u).toContain('"created_by_id":"op-1"');
  });

  test.describe('timezone boundary', () => {
    test.use({ timezoneId: 'America/New_York' });

    test('a report from "earlier today" locally but yesterday in UTC is not claimable', async ({
      page,
    }) => {
      // Now: Mon 28 Sep 00:30 UTC = Sun 27 Sep 20:30 in New York.
      // Report: Sun 27 Sep 23:50 UTC = Sun 19:50 New York — same local day,
      // but the previous UTC day AND the previous ISO week.
      const db: MockDb = { user: OP, locations: { a: loc('a', '2026-09-27T23:50:00Z') } };
      const board = await openBoard(page, db, '2026-09-28T00:30:00Z');

      await expect(mission(board, 'daily_report')).toHaveAttribute('data-state', 'available');
      await expect(mission(board, 'daily_report')).toContainText('0/1');
      await expect(mission(board, 'weekly_reports')).toContainText('0/5');
      await expect(board.getByRole('button', { name: /Claim/ })).toHaveCount(0);
      await expect(board.getByRole('region', { name: 'Daily missions' })).toContainText(
        'resets in 23h 30m',
      );
      await expect(board).toContainText('00:00 UTC');
    });
  });

  test('a server refusal is shown honestly and nothing is marked claimed', async ({ page }) => {
    const db: MockDb = {
      user: OP,
      locations: { a: loc('a', '2026-09-30T09:00:00Z') },
      claimQuestStatus: 403,
    };
    const board = await openBoard(page, db, '2026-09-30T12:00:00Z');
    await mission(board, 'daily_report').getByRole('button', { name: /Claim/ }).click();
    await expect(mission(board, 'daily_report')).toContainText(/Not complete yet/i);
    await expect(mission(board, 'daily_report')).not.toHaveAttribute('data-state', 'claimed');
  });

  test('keyboard: the claim action is reachable and operable', async ({ page }) => {
    const db: MockDb = { user: OP, locations: { a: loc('a', '2026-09-30T09:00:00Z') } };
    const board = await openBoard(page, db, '2026-09-30T12:00:00Z');
    const claim = mission(board, 'daily_report').getByRole('button', { name: /Claim/ });
    await claim.focus();
    await expect(claim).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(mission(board, 'daily_report')).toHaveAttribute('data-state', 'claimed');
  });

  test('the board fits the viewport without horizontal scroll', async ({ page }) => {
    const db: MockDb = { user: OP, locations: {} };
    await openBoard(page, db, '2026-09-30T12:00:00Z');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
