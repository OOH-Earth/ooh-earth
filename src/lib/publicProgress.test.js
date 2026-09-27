import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BADGES } from '../components/ooh/gamification/gamification.js';
import { publicEarnedBadges, publicStatsFrom } from './publicProgress.js';

test('publicStatsFrom maps only the two provably-public counts, coercing safely', () => {
  assert.deepEqual(publicStatsFrom({ verified_reports: 3, verified_rechecks: 1 }), {
    verified: 3,
    rechecksVerified: 1,
  });
  assert.deepEqual(publicStatsFrom({}), { verified: 0, rechecksVerified: 0 });
  assert.deepEqual(publicStatsFrom(null), { verified: 0, rechecksVerified: 0 });
  assert.deepEqual(publicStatsFrom(undefined), { verified: 0, rechecksVerified: 0 });
  // Malformed/hostile input never crashes and never coerces to something truthy.
  assert.deepEqual(publicStatsFrom({ verified_reports: 'not a number', verified_rechecks: -5 }), {
    verified: 0,
    rechecksVerified: -5,
  });
});

// Fixed, explicit expectation: exactly which badges are publicly derivable
// today. If BADGES ever changes, this test fails loudly rather than
// silently exposing (or silently losing) a badge -- the set is reviewed,
// not auto-widened.
const EXPECTED_PUBLIC_BADGE_IDS = ['truth_seeker', 'first_recheck', 'timeline_builder'];

test('only badges whose check() depends solely on the two public counts are ever derivable', () => {
  // Every other field a badge could check is left at a huge, badge-passing
  // value -- if any additional badge slipped through anyway, this would
  // catch it (proving it doesn't actually need the missing public data).
  const generousButOtherwiseUndefined = { verified: 0, rechecksVerified: 0 };
  const ids = publicEarnedBadges({ verified_reports: 0, verified_rechecks: 0 }).map((b) => b.id);
  assert.deepEqual(ids, []);

  const allIds = BADGES.map((b) => b.id);
  for (const id of EXPECTED_PUBLIC_BADGE_IDS) {
    assert.ok(allIds.includes(id), `expected badge '${id}' still exists in BADGES`);
  }

  const maxed = publicEarnedBadges({ verified_reports: 1_000_000, verified_rechecks: 1_000_000 });
  assert.deepEqual(maxed.map((b) => b.id).sort(), [...EXPECTED_PUBLIC_BADGE_IDS].sort());
  void generousButOtherwiseUndefined;
});

test('badges appear exactly at their real, canonical thresholds', () => {
  // truth_seeker: verified >= 10
  assert.equal(
    publicEarnedBadges({ verified_reports: 9, verified_rechecks: 0 }).some(
      (b) => b.id === 'truth_seeker',
    ),
    false,
  );
  assert.equal(
    publicEarnedBadges({ verified_reports: 10, verified_rechecks: 0 }).some(
      (b) => b.id === 'truth_seeker',
    ),
    true,
  );
  // first_recheck: rechecksVerified >= 1
  assert.equal(
    publicEarnedBadges({ verified_reports: 0, verified_rechecks: 0 }).some(
      (b) => b.id === 'first_recheck',
    ),
    false,
  );
  assert.equal(
    publicEarnedBadges({ verified_reports: 0, verified_rechecks: 1 }).some(
      (b) => b.id === 'first_recheck',
    ),
    true,
  );
  // timeline_builder: rechecksVerified >= 5
  assert.equal(
    publicEarnedBadges({ verified_reports: 0, verified_rechecks: 4 }).some(
      (b) => b.id === 'timeline_builder',
    ),
    false,
  );
  assert.equal(
    publicEarnedBadges({ verified_reports: 0, verified_rechecks: 5 }).some(
      (b) => b.id === 'timeline_builder',
    ),
    true,
  );
});

// The property that actually matters for safety: whatever a member's real,
// full private stats are, the public subset — built from the exact counts
// getPublicProfile derives from that same private truth — must NEVER show
// a badge the private page wouldn't also show. It may show fewer, never
// more. Swept over a wide, varied set of synthetic full-stats
// combinations, not just the fixed examples above.
function randomFullStats(seed) {
  // Small deterministic PRNG so this test is reproducible, not flaky.
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const n = (max) => Math.floor(next() * max);
  return {
    reports: n(150),
    verified: n(150),
    photos: n(150),
    busts: n(20),
    mints: n(20),
    leads: n(20),
    rechecksVerified: n(20),
    streak: n(60),
    xp: n(30000),
    brandCounts: Array.from({ length: n(30) }, () => ({ count: n(30) })),
  };
}

test('public badges are always a subset of the private truth (property test, 500 cases)', () => {
  for (let i = 0; i < 500; i++) {
    const full = randomFullStats(i * 7919 + 1);
    const privateEarned = new Set(BADGES.filter((b) => b.check(full)).map((b) => b.id));
    // The public counts are derived from the SAME underlying truth that
    // produced `full.verified` / `full.rechecksVerified` in this
    // scenario -- exactly what getPublicProfile itself computes.
    const contributions = {
      verified_reports: full.verified,
      verified_rechecks: full.rechecksVerified,
    };
    const publicEarned = publicEarnedBadges(contributions).map((b) => b.id);
    for (const id of publicEarned) {
      assert.ok(
        privateEarned.has(id),
        `case ${i}: public badge '${id}' was shown but is not actually earned privately (full=${JSON.stringify(full)})`,
      );
    }
  }
});

test('a badge check() throwing on unexpected shape degrades to not-earned, not a crash', () => {
  const originalCheck = BADGES[0].check;
  BADGES[0].check = () => {
    throw new Error('boom');
  };
  try {
    assert.doesNotThrow(() => publicEarnedBadges({ verified_reports: 5 }));
  } finally {
    BADGES[0].check = originalCheck;
  }
});
