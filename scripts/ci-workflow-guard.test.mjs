// Offline guard for .github/workflows/ci.yml. Run: node --test scripts/ci-workflow-guard.test.mjs
// Plain text scanning on purpose: no YAML dependency (js-yaml is only a transitive dev dep).
// LIMITS — this is a tripwire, not a YAML validator: it assumes 2-space indentation and the inline
// `branches: [a, b]` form (a block-list rewrite fails loudly, it is not silently accepted); it checks
// only ci.yml, only top-level `permissions`, only `uses:` at line start and `${{ secrets.* }}`
// expressions. It does not evaluate job conditions or prove which jobs run — a real PR run does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ci = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8');
const lines = ci.split('\n');

// Branch globs listed under `on: pull_request: branches: [...]`.
function pullRequestBranches() {
  const i = lines.findIndex((l) => /^ {2}pull_request:\s*$/.test(l));
  assert.ok(i >= 0, 'ci.yml must have an `on: pull_request:` trigger');
  for (let j = i + 1; j < lines.length && /^ {4}/.test(lines[j]); j++) {
    const m = lines[j].match(/^ {4}branches:\s*\[(.*)\]/);
    if (m) return m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
  }
  return [];
}

test('PRs into main AND maintenance/** run the full CI workflow', () => {
  const b = pullRequestBranches();
  assert.ok(b.includes('main'), `main missing from pull_request branches: ${b}`);
  assert.ok(
    b.includes('maintenance/**'),
    `maintenance/** missing from pull_request branches: ${b}`,
  );
});

test('no privileged or secret-bearing triggers (CLAUDE.md rule #4, untrusted PR safety)', () => {
  assert.doesNotMatch(
    ci,
    /pull_request_target/,
    'pull_request_target would run untrusted code with secrets',
  );
  assert.doesNotMatch(ci, /workflow_run/, 'workflow_run runs with base-repo privileges');
  assert.doesNotMatch(ci, /\$\{\{\s*secrets\./, 'CI must not reference repository secrets');
});

test('every action is pinned to a full commit SHA', () => {
  const unpinned = lines.filter((l) => /^\s*-?\s*uses:/.test(l) && !/@[0-9a-f]{40}\b/.test(l));
  assert.deepEqual(unpinned, []);
});

test('top-level token permissions stay least-privilege', () => {
  const i = lines.findIndex((l) => /^permissions:\s*$/.test(l));
  assert.ok(i >= 0, 'ci.yml must declare top-level permissions');
  const perms = [];
  for (let j = i + 1; j < lines.length && /^ {2}\S/.test(lines[j]); j++)
    perms.push(lines[j].trim());
  const writes = perms.filter((p) => /:\s*write$/.test(p)).map((p) => p.split(':')[0]);
  assert.deepEqual(
    writes.sort(),
    ['checks', 'pull-requests'],
    `unexpected write scopes: ${writes}`,
  );
});
