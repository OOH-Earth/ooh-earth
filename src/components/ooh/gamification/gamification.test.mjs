// Zero added dependencies. Not wired into any script/CI job. gamification.js
// re-exports from an extensionless relative import ('../pointsConfig'), a
// pre-existing pattern this repo's src/ relies on Vite to resolve -- plain
// `node` can't load it directly, so bundle first with the project's own
// (already-vendored) esbuild, then run the output:
//   npx esbuild src/components/ooh/gamification/gamification.test.mjs \
//     --bundle --format=esm --platform=node --outfile=/tmp/gt.mjs && node /tmp/gt.mjs
import assert from 'node:assert/strict';
import { BADGES, pointsForRecheck } from './gamification.js';

const firstRecheck = BADGES.find((b) => b.id === 'first_recheck');
const timelineBuilder = BADGES.find((b) => b.id === 'timeline_builder');

assert.ok(firstRecheck, 'first_recheck badge must exist');
assert.ok(timelineBuilder, 'timeline_builder badge must exist');

// first_recheck
assert.equal(firstRecheck.check({ rechecks: 0 }), false);
assert.equal(firstRecheck.check({ rechecks: 1 }), true);
assert.equal(
  firstRecheck.check({}),
  false,
  'missing stats.rechecks must not throw or default to earned',
);

// timeline_builder
assert.equal(timelineBuilder.check({ rechecksVerified: 4 }), false);
assert.equal(timelineBuilder.check({ rechecksVerified: 5 }), true);
assert.deepEqual(timelineBuilder.progress({ rechecksVerified: 3 }), { current: 3, target: 5 });
assert.deepEqual(
  timelineBuilder.progress({}),
  { current: 0, target: 5 },
  'missing stats.rechecksVerified must degrade to 0, not throw',
);

// pointsForRecheck is correctly re-exported through gamification.js, the
// module useGamification.js actually imports from.
assert.equal(pointsForRecheck({ status: 'verified' }), 20);

console.log('gamification.test.mjs: all assertions passed');
