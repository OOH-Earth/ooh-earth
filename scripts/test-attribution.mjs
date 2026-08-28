import assert from 'node:assert/strict';
import { getSessionAttribution, markQualifiedVisit } from '../src/lib/attribution.js';

const values = new Map();
const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
const location = { pathname: '/blog/transit-advertising-public-space-evidence', search: '?utm_source=github&utm_medium=referral&utm_campaign=github_readme&utm_content=transit' };
const first = getSessionAttribution(location, storage);
assert.deepEqual(first, { utm_source: 'github', utm_medium: 'referral', utm_campaign: 'github_readme', utm_content: 'transit', landing_path: location.pathname });
assert.deepEqual(getSessionAttribution({ pathname: '/map', search: '?utm_source=other&utm_campaign=other' }, storage), first);
assert.equal(markQualifiedVisit(storage), true);
assert.equal(markQualifiedVisit(storage), false);
assert.equal(first.utm_source, 'github');
assert.equal(first.utm_campaign, 'github_readme');
console.log('ATTRIBUTION_REGRESSION_PASS');
