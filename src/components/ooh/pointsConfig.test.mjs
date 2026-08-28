// Plain Node test, zero dependencies -- this repo has no frontend unit
// test runner wired into `npm test` (only Playwright e2e + Deno backend
// tests exist). Not wired into any script/CI job; run directly:
//   node src/components/ooh/pointsConfig.test.mjs
import assert from 'node:assert/strict';
import { POINTS, pointsForReport, pointsForRecheck } from './pointsConfig.js';

// Regression: existing report math must be unchanged by this addition.
assert.equal(pointsForReport({ status: 'pending' }), 10);
assert.equal(pointsForReport({ status: 'verified' }), 50);
assert.equal(pointsForReport({ status: 'pending', image_url: 'x' }), 60);
assert.equal(pointsForReport({ status: 'verified', image_url: 'x' }), 100);

// New: a re-check previously earned exactly 0 XP everywhere in this app.
assert.equal(
  pointsForRecheck({ status: 'pending' }),
  5,
  'pending re-check should earn base credit',
);
assert.equal(
  pointsForRecheck({ status: 'verified' }),
  20,
  'verified re-check should earn base + verified bonus',
);
assert.equal(
  pointsForRecheck({ status: 'rejected' }),
  5,
  'rejected re-check still earns base credit, same as a rejected report',
);

// A re-check must never be worth more than a fresh verified+photo report --
// that would invert the intended discovery > confirmation priority.
const maxReportXp = pointsForReport({ status: 'verified', image_url: 'x' });
const maxRecheckXp = pointsForRecheck({ status: 'verified' });
assert.ok(
  maxRecheckXp < maxReportXp,
  `re-check (${maxRecheckXp}) must stay below a full new report (${maxReportXp})`,
);

assert.equal(POINTS.recheck_filed, 5);
assert.equal(POINTS.recheck_verified_bonus, 15);

console.log('pointsConfig.test.mjs: all assertions passed');
