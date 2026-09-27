import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MISSION_STATES,
  claimFeedback,
  formatResetIn,
  missionState,
  missionStatus,
  periodMetrics,
} from './missions.js';
import { periodKey } from './questPeriod.js';

const QUESTS = [
  { id: 'daily_report', type: 'daily', target: 1, metric: 'dailyReports', reward_xp: 50 },
  { id: 'daily_photo', type: 'daily', target: 1, metric: 'dailyPhotos', reward_xp: 50 },
  { id: 'weekly_reports', type: 'weekly', target: 5, metric: 'weeklyReports', reward_xp: 200 },
];

// Monday 2026-09-28 00:30 UTC — just after both a day and a week boundary.
const NOW = new Date('2026-09-28T00:30:00Z');

test('period metrics use UTC windows, including offset-less Base44 timestamps', () => {
  const m = periodMetrics(
    {
      locations: [
        { created_date: '2026-09-28T00:10:00.000000', image_url: 'https://x/y.jpg' }, // today UTC
        { created_date: '2026-09-27T23:50:00.000000' }, // yesterday UTC, last ISO week
        { created_date: '2026-09-28T00:20:00.000000', image_url: '' },
      ],
      busts: [{ created_date: '2026-09-28T00:05:00.000000' }],
      mints: [{ created_date: 'not a date' }],
    },
    NOW,
  );
  assert.deepEqual(m, {
    dailyReports: 2,
    dailyPhotos: 1,
    weeklyReports: 2,
    weeklyBusts: 1,
    weeklyMints: 0,
  });
});

test('mission state follows progress and claim', () => {
  assert.equal(missionState({ progress: 0, target: 5, claimed: false }), MISSION_STATES.AVAILABLE);
  assert.equal(
    missionState({ progress: 2, target: 5, claimed: false }),
    MISSION_STATES.IN_PROGRESS,
  );
  assert.equal(missionState({ progress: 5, target: 5, claimed: false }), MISSION_STATES.COMPLETED);
  assert.equal(missionState({ progress: 5, target: 5, claimed: true }), MISSION_STATES.CLAIMED);
});

test('claimed is decided by created_date in the current UTC period and only for the caller', () => {
  const completions = [
    // Claimed yesterday (UTC) → does not count for today.
    { quest_id: 'daily_report', created_by_id: 'me', created_date: '2026-09-27T23:59:00.000000' },
    // Someone else's claim never counts for me.
    { quest_id: 'daily_photo', created_by_id: 'other', created_date: '2026-09-28T00:01:00.000000' },
    // Old-format key colliding with this week's key, but created last week.
    {
      quest_id: 'weekly_reports',
      created_by_id: 'me',
      period_key: periodKey('weekly', NOW),
      created_date: '2026-09-26T10:00:00.000000',
    },
  ];
  const status = missionStatus(
    QUESTS,
    { dailyReports: 1, dailyPhotos: 1, weeklyReports: 7 },
    completions,
    'me',
    NOW,
  );
  assert.deepEqual(
    status.map((s) => [s.id, s.state, s.progress]),
    [
      ['daily_report', 'completed', 1],
      ['daily_photo', 'completed', 1],
      ['weekly_reports', 'completed', 5],
    ],
  );
  const claimedNow = missionStatus(
    QUESTS,
    { dailyReports: 1 },
    [{ quest_id: 'daily_report', created_by_id: 'me', created_date: '2026-09-28T00:02:00.000000' }],
    'me',
    NOW,
  );
  assert.equal(claimedNow[0].state, 'claimed');
});

test('no user → nothing is ever shown as claimed', () => {
  const s = missionStatus(
    QUESTS,
    {},
    [{ quest_id: 'daily_report', created_by_id: undefined, created_date: '2026-09-28T00:02:00Z' }],
    null,
    NOW,
  );
  assert.ok(s.every((x) => !x.claimed && x.state === 'available'));
});

test('reset countdown and period keys come from the shared UTC definition', () => {
  const [daily, , weekly] = missionStatus(QUESTS, {}, [], 'me', NOW);
  assert.equal(daily.period, '2026-09-28');
  assert.equal(weekly.period, '2026-W40');
  assert.equal(daily.resetsInMs, 23.5 * 3_600_000);
  assert.equal(formatResetIn(daily.resetsInMs), '23h 30m');
  assert.equal(formatResetIn(weekly.resetsInMs), '6d 23h');
  assert.equal(formatResetIn(30_000), '1m');
  assert.equal(formatResetIn(-1), 'now');
});

test('claim feedback is honest for each server outcome', () => {
  assert.equal(claimFeedback({ ok: true, xp_awarded: 50 }).text, '+50 XP banked.');
  assert.match(claimFeedback({ ok: true, already: true }).text, /Already claimed/);
  assert.match(claimFeedback({ status: 403 }).text, /UTC/);
  assert.match(claimFeedback({ status: 401 }).text, /Log in/);
  assert.match(claimFeedback({ status: 500 }).text, /unavailable/);
});
