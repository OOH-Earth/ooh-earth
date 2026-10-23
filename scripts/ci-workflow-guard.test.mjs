// Offline guard for .github/workflows/ci.yml. Run: npm run test:ci-workflow-guard
// Logic lives in ci-workflow-guard.mjs; fixtures below prove it separates comments from config.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan, stripComment } from './ci-workflow-guard.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHA = '3d3c42e5aac5ba805825da76410c181273ba90b1';

// Smallest workflow the guard accepts; each fixture below tweaks one thing.
const base = (extra = '', on = '') => `name: X
on:
  push:
    branches: [main]
  pull_request:
    branches: [main, 'maintenance/**']
${on}permissions:
  contents: read
  pull-requests: write
  checks: write
jobs:
  a:
    steps:
      - uses: actions/checkout@${SHA} # v7
${extra}`;

test('the real ci.yml is clean', () => {
  const ci = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8');
  assert.deepEqual(scan(ci), []);
});

test('fixture: baseline is clean', () => assert.deepEqual(scan(base()), []));

test('fixture: a COMMENT mentioning prohibited words is allowed', () => {
  const commented = base(
    '      # pull_request_target and workflow_run are forbidden; never use ${{ secrets.TOKEN }}\n',
    '# pull_request_target would be dangerous here\n',
  );
  assert.deepEqual(scan(commented), []);
});

test('fixture: ACTIVE pull_request_target is rejected', () => {
  const active = base('', '  pull_request_target:\n    branches: [main]\n');
  assert.ok(
    scan(active).some((p) => /pull_request_target/.test(p)),
    scan(active).join('; '),
  );
});

test('fixture: ACTIVE secret reference is rejected, even after a quoted # (not a comment)', () => {
  const secret = base('      - run: echo "# ${{ secrets.TOKEN }}"\n');
  assert.ok(
    scan(secret).some((p) => /secrets/.test(p)),
    scan(secret).join('; '),
  );
});

test('fixture: unpinned action and missing maintenance trigger are rejected', () => {
  const unpinned = base('      - uses: actions/setup-node@v4\n');
  assert.ok(scan(unpinned).some((p) => /not pinned/.test(p)));
  const noMaint = base().replace(", 'maintenance/**'", '');
  assert.ok(scan(noMaint).some((p) => /maintenance\/\*\*/.test(p)));
});

test('stripComment only cuts real comments', () => {
  assert.equal(stripComment('uses: a@b # v7'), 'uses: a@b');
  assert.equal(stripComment('# whole line'), '');
  assert.equal(stripComment('run: echo "a # b"'), 'run: echo "a # b"');
  assert.equal(stripComment("branches: ['x#y']"), "branches: ['x#y']");
});
