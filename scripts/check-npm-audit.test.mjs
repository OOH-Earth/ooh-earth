import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { evaluateAudit } from './check-npm-audit.mjs';

const clean = () => ({
  metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } },
});
test('accepts a completed clean audit', () =>
  assert.match(evaluateAudit(clean(), 0), /passed/),
);
test('permits low/moderate findings under the existing high threshold', () => {
  const report = clean();
  Object.assign(report.metadata.vulnerabilities, { low: 2, moderate: 1, total: 3 });
  assert.match(evaluateAudit(report, 0), /passed/);
});
for (const severity of ['high', 'critical']) {
  test(`rejects ${severity} findings even if the command reports success`, () => {
    const report = clean();
    Object.assign(report.metadata.vulnerabilities, { [severity]: 1, total: 1 });
    assert.throws(() => evaluateAudit(report, 0), /High\/critical/);
  });
}
test('rejects provider error JSON, including error plus plausible metadata', () => {
  for (const report of [{ error: { code: 'ENOAUDIT' } }, { ...clean(), error: {} }]) {
    assert.throws(() => evaluateAudit(report, 1), /successful report/);
  }
});
test('rejects absent reports or metadata', () => {
  for (const report of [null, [], {}, { metadata: {} }]) {
    assert.throws(() => evaluateAudit(report, 0));
  }
});
test('rejects missing, string, negative or nonfinite counts', () => {
  for (const value of [undefined, '0', -1, NaN, Infinity]) {
    const report = clean();
    report.metadata.vulnerabilities.high = value;
    assert.throws(() => evaluateAudit(report, 0), /invalid vulnerability counts/);
  }
});
test('rejects inconsistent totals', () => {
  const report = clean();
  report.metadata.vulnerabilities.total = 1;
  assert.throws(() => evaluateAudit(report, 0), /inconsistent/);
});
test('rejects command failure despite clean-looking output', () => {
  assert.throws(() => evaluateAudit(clean(), 1), /execution failed/);
});
test('rejects invalid exit status', () => {
  for (const status of [-1, 256, NaN, 0.5]) assert.throws(() => evaluateAudit(clean(), status));
});
test('CLI propagates malformed, empty, missing and error reports as nonzero', () => {
  const dir = mkdtempSync(join(tmpdir(), 'audit-gate-'));
  const script = fileURLToPath(new URL('./check-npm-audit.mjs', import.meta.url));
  try {
    for (const [name, contents] of [
      ['malformed', '{'],
      ['empty', ''],
      ['error', '{"error":{}}'],
    ]) {
      const path = join(dir, name);
      writeFileSync(path, contents);
      assert.equal(spawnSync(process.execPath, [script, path, '1']).status, 1);
    }
    assert.equal(spawnSync(process.execPath, [script, join(dir, 'missing'), '0']).status, 1);
    const path = join(dir, 'clean');
    writeFileSync(path, JSON.stringify(clean()));
    assert.equal(spawnSync(process.execPath, [script, path, '0']).status, 0);
    assert.equal(spawnSync(process.execPath, [script, path, '1']).status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
