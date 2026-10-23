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
test('fixture: job-level write-all permissions are rejected', () => {
  const bad = base().replace('    steps:', '    permissions: write-all\n    steps:');
  assert.ok(
    scan(bad).some((p) => /write-all/.test(p)),
    scan(bad).join('; '),
  );
});

test('fixture: top-level write-all is rejected (with a specific message)', () => {
  const top = base().replace(
    'permissions:\n  contents: read\n  pull-requests: write\n  checks: write\n',
    'permissions: write-all\n',
  );
  assert.ok(
    scan(top).some((p) => /write-all/.test(p)),
    scan(top).join('; '),
  );
});

test('fixture: write-all in a COMMENT or in quoted/embedded text is allowed', () => {
  const comment = base('      # permissions: write-all would be bad here\n');
  assert.deepEqual(scan(comment), []);
  const quoted = base('      - run: echo "permissions: write-all"\n');
  assert.deepEqual(scan(quoted), []);
  const trailing = base().replace(
    '    steps:',
    '    permissions:\n      contents: read # not write-all\n    steps:',
  );
  assert.deepEqual(scan(trailing), []);
});

test('policy scope: GITHUB_TOKEN and a subset of write scopes are allowed; other secrets/scopes are not', () => {
  const tokenUse = base('      - run: echo ${{ secrets.GITHUB_TOKEN }}\n');
  assert.deepEqual(scan(tokenUse), []);
  const subset = base().replace('  pull-requests: write\n  checks: write\n', '  checks: write\n');
  assert.deepEqual(scan(subset), []);
  const otherSecret = base('      - run: echo ${{ secrets.DEPLOY_KEY }}\n');
  assert.ok(
    scan(otherSecret).some((p) => /secrets/.test(p)),
    scan(otherSecret).join('; '),
  );
  const extraScope = base().replace('  checks: write\n', '  checks: write\n  contents: write\n');
  assert.ok(
    scan(extraScope).some((p) => /write scopes: contents/.test(p)),
    scan(extraScope).join('; '),
  );
});
