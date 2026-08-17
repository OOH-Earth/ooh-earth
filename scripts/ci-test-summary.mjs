#!/usr/bin/env node
// Turns a Playwright JSON-reporter report into a compact GitHub Actions Job
// Summary: pass/fail/skip counts plus, for every failing test, its title,
// spec file, line number, and a trimmed error message -- so a human can see
// exactly what broke from the workflow run page, without opening the full
// log or downloading the HTML report. The HTML report / traces / screenshots
// remain the source of truth for full detail; this is a fast triage layer,
// not a replacement.
//
// Usage: node scripts/ci-test-summary.mjs <report.json> <job-label>
// Writes markdown to stdout -- the workflow step appends it to
// $GITHUB_STEP_SUMMARY. Never throws: a missing/malformed report degrades to
// a one-line notice rather than failing the step and masking the real error.

import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

const [, , reportPath, jobLabel = 'Playwright'] = process.argv;

function relPath(p) {
  if (!p) return p;
  try {
    return relative(process.cwd(), p) || p;
  } catch {
    return p;
  }
}

function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function firstLines(s, maxLines = 4, maxChars = 400) {
  const clean = stripAnsi(s).trim();
  const lines = clean.split('\n').slice(0, maxLines);
  const joined = lines.join('\n');
  return joined.length > maxChars ? joined.slice(0, maxChars) + '…' : joined;
}

// Walks the JSON reporter's suite tree (suites nest arbitrarily for
// describe blocks) collecting one entry per spec whose most recent test
// result isn't a pass.
function collectFailures(suites, out) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const last = test.results?.[test.results.length - 1];
        if (!last || last.status === 'passed') continue;
        const errorMsg =
          last.error?.message || last.errors?.[0]?.message || last.status || 'unknown error';
        // Prefer the error's own location (the exact failing assertion line)
        // over the spec's location (where the test() call itself is
        // defined) when Playwright provides one.
        const loc = last.error?.location || last.errors?.[0]?.location;
        out.push({
          title: spec.title,
          file: relPath(loc?.file) || spec.file,
          line: loc?.line ?? spec.line,
          status: last.status,
          message: firstLines(errorMsg),
        });
      }
    }
    if (suite.suites?.length) collectFailures(suite.suites, out);
  }
}

function main() {
  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, 'utf8'));
  } catch {
    console.log(
      `### ${jobLabel}\n\n_No test report found at \`${reportPath}\` — see raw logs above._\n`,
    );
    return;
  }

  const stats = report.stats || {};
  const passed = stats.expected ?? 0;
  const failed = stats.unexpected ?? 0;
  const flaky = stats.flaky ?? 0;
  const skipped = stats.skipped ?? 0;
  const total = passed + failed + flaky + skipped;

  const failures = [];
  collectFailures(report.suites, failures);

  const lines = [];
  lines.push(`### ${jobLabel}`);
  lines.push('');
  lines.push(
    `**${total} total** — ${passed} passed, ${failed} failed, ${flaky} flaky, ${skipped} skipped`,
  );
  lines.push('');

  if (failures.length) {
    lines.push('| Test | Location | Error |');
    lines.push('|---|---|---|');
    for (const f of failures) {
      const loc = f.file ? `\`${f.file}:${f.line ?? '?'}\`` : '—';
      const msg = f.message.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
      lines.push(`| ${f.title} | ${loc} | ${msg} |`);
    }
    lines.push('');
    lines.push(
      'Full trace/screenshot artifacts are attached to this run (see the "Artifacts" section).',
    );
  } else if (failed === 0 && flaky === 0) {
    lines.push('All tests passed.');
  }
  lines.push('');

  console.log(lines.join('\n'));
}

main();
