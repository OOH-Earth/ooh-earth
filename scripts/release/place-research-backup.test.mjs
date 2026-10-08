import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const script = fs.readFileSync(new URL('./place-research-backup.sh', import.meta.url), 'utf8');
const gate = script.match(
  /# Public GitHub read only[\s\S]*?node --input-type=module - <<'JS'\n([\s\S]*?)\nJS/,
)[1];
const fakeNetwork = `
const scenario = process.env.OOH_GATE_SCENARIO;
const calls = new Map();
let clock = 0;
if (scenario === 'deadline' || scenario === 'missing-run') Date.now = () => (clock += 1300000);
globalThis.setTimeout = callback => { queueMicrotask(callback); return 0; };
const names = ['CI', 'CodeQL', 'Interaction regression (zero retries)'];
globalThis.fetch = async url => {
  const count = (calls.get(url) || 0) + 1;
  calls.set(url, count);
  if (scenario === 'network') throw Error('Simulated offline network');
  if (scenario === 'rate-limit') return { ok: false, status: 403 };
  if (url.includes('/actions/runs?head_sha=')) {
    const pending = scenario === 'deadline' || (scenario === 'pending' && count === 1);
    const present = scenario === 'missing-run' ? names.slice(0, 2) : names;
    return { ok: true, json: async () => ({ workflow_runs: present.map((name, index) => ({
      id: 100 + index, run_number: 5, name, event: name === 'CodeQL' || name === 'CI' ? 'push' : 'workflow_dispatch',
      head_sha: scenario === 'wrong-head' ? 'different-source' : process.env.CANDIDATE_SHA,
      status: pending ? 'in_progress' : 'completed',
      conclusion: pending ? null : scenario === 'failed' && index === 1 ? 'failure' : scenario === 'cancelled' && index === 2 ? 'cancelled' : 'success',
      html_url: 'https://example.invalid/' + index,
    })).concat(scenario === 'stale-pr-run' ? [{ id: 1, run_number: 9, name: 'CI', event: 'pull_request',
      head_sha: process.env.CANDIDATE_SHA, status: 'completed', conclusion: 'failure' }] : []) }) };
  }
  if (url.includes('/compare/')) return { ok: true, json: async () => ({
    status: scenario === 'not-on-main' ? 'diverged' : 'ahead' }) };
  if (url === 'https://ooh-earth-backup.base44.app/') return { ok: true, text: async () =>
    scenario === 'ambiguous-entry' ? '<html></html>' : '<script type="module" src="/assets/index-previous.js"></script>' };
  throw Error('Unexpected endpoint in qualification gate');
};
`;

for (const scenario of [
  'green',
  'pending',
  'stale-pr-run',
  'failed',
  'cancelled',
  'wrong-head',
  'not-on-main',
  'missing-run',
  'rate-limit',
  'network',
  'deadline',
  'ambiguous-entry',
]) {
  test(`qualification gate: ${scenario}`, () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), 'gate-policy.'));
    try {
      const result = spawnSync(process.execPath, ['--input-type=module'], {
        input: fakeNetwork + gate,
        env: {
          ...process.env,
          OOH_GATE_SCENARIO: scenario,
          CANDIDATE_SHA: 'qualified-source',
          BACKUP_APP_ID: 'backup-only',
          EVIDENCE_DIR: dir,
        },
        encoding: 'utf8',
        timeout: 5000,
      });
      // A failed pull_request run of the same commit is not a push/dispatch qualification run.
      const pass = ['green', 'pending', 'stale-pr-run'].includes(scenario);
      assert.equal(result.status === 0, pass, result.stderr);
      assert.equal(fs.existsSync(path.join(dir, 'pre-deploy-summary.json')), pass);
      if (pass) {
        const evidence = JSON.parse(fs.readFileSync(path.join(dir, 'ci-proof.json'), 'utf8'));
        assert.equal(evidence.length, 3);
        assert.ok(
          evidence.every((run) => run.head === 'qualified-source' && run.conclusion === 'success'),
        );
      }
      if (scenario === 'pending')
        assert.match(result.stdout, /Waiting for exact-head qualification/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}
