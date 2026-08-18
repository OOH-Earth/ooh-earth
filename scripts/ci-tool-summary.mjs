#!/usr/bin/env node
// Turns a raw tsc/eslint/prettier/vite-build log into a compact GitHub
// Actions Job Summary -- a human can see exactly what broke (file, line,
// message) from the workflow run page without reading the full raw log.
// Mirrors ci-test-summary.mjs's own philosophy: never throw (a log this
// script can't parse degrades to "see raw log above", not a masked step
// failure), and never emit unescaped user-controlled text into the
// Markdown table.
//
// Usage: node scripts/ci-tool-summary.mjs <tsc|eslint|prettier|vite> <log-file> <job-label>
// Writes markdown to stdout -- the workflow step appends it to
// $GITHUB_STEP_SUMMARY.

import { readFileSync } from 'node:fs';

const [, , tool, logPath, jobLabel = tool] = process.argv;

function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

// Backslash must be escaped *first* -- escaping the other characters before
// it would let a pre-existing backslash in the input recombine with the
// newly-inserted escape backslashes and change what gets rendered.
function escapeTableCell(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function truncate(s, maxChars = 300) {
  return s.length > maxChars ? s.slice(0, maxChars) + '…' : s;
}

// tsc's default reporter: `path/to/file.ts(12,34): error TS2345: message`
function parseTsc(text) {
  const rows = [];
  const re = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/gm;
  let m;
  while ((m = re.exec(text))) {
    rows.push({ file: m[1], line: m[2], message: `${m[4]}: ${m[5]}` });
  }
  return rows;
}

// eslint "stylish" reporter: a bare file path line, then indented
// `  line:col  error  message  rule-id` lines underneath it.
function parseEslint(text) {
  const rows = [];
  let currentFile = null;
  for (const raw of text.split('\n')) {
    const line = stripAnsi(raw);
    const errMatch = line.match(/^\s+(\d+):(\d+)\s+error\s+(.+?)(?:\s{2,}(\S+))?\s*$/);
    if (errMatch) {
      rows.push({ file: currentFile || '(unknown file)', line: errMatch[1], message: errMatch[3] });
      continue;
    }
    // A non-indented, non-empty line that isn't a summary line is a file path.
    if (line && !/^\s/.test(line) && !/^\d+ problems?/.test(line) && !/^✖/.test(line)) {
      currentFile = line.trim();
    }
  }
  return rows;
}

// `prettier --check` lists one non-conforming file per line, prefixed
// "[warn] ". Everything else in the output (the npm script header, the
// "Checking formatting..." line, the final "Code style issues..." summary)
// is not a file and must be excluded explicitly rather than assumed away.
function parsePrettier(text) {
  const rows = [];
  for (const raw of text.split('\n')) {
    const line = stripAnsi(raw).trim();
    const m = line.match(/^\[warn\]\s*(.+)$/i);
    if (m && !/^Code style issues found/i.test(m[1])) {
      rows.push({ file: m[1], line: null, message: 'not formatted — run `npx prettier --write`' });
    }
  }
  return rows;
}

// vite/rollup build errors don't have one fixed shape -- surface the lines
// that actually say "error" rather than the whole log, falling back to a
// trailing window if nothing matches (still far shorter than the full log).
function parseVite(text) {
  const lines = text.split('\n').map(stripAnsi);
  const hits = [];
  lines.forEach((line, i) => {
    if (/error/i.test(line) && line.trim()) hits.push({ i, line });
  });
  if (!hits.length) {
    return lines
      .slice(-15)
      .filter((l) => l.trim())
      .map((l) => ({ file: null, line: null, message: l.trim() }));
  }
  return hits.map(({ i, line }) => ({
    file: null,
    line: null,
    message: truncate([lines[i - 1], line, lines[i + 1]].filter(Boolean).join(' ').trim()),
  }));
}

const PARSERS = { tsc: parseTsc, eslint: parseEslint, prettier: parsePrettier, vite: parseVite };

function main() {
  let text;
  try {
    text = readFileSync(logPath, 'utf8');
  } catch {
    console.log(`### ${jobLabel}\n\n_No log found at \`${logPath}\` — see raw logs above._\n`);
    return;
  }

  const parse = PARSERS[tool];
  if (!parse) {
    console.log(
      `### ${jobLabel}\n\n_Failed — unrecognized tool \`${tool}\`, see raw logs above._\n`,
    );
    return;
  }

  let rows = [];
  try {
    rows = parse(text).slice(0, 25);
  } catch {
    rows = [];
  }

  const lines = [];
  lines.push(`### ${jobLabel} — failed`);
  lines.push('');
  if (rows.length) {
    lines.push('| Location | Error |');
    lines.push('|---|---|');
    for (const r of rows) {
      const loc = r.file ? `\`${escapeTableCell(r.file)}${r.line ? ':' + r.line : ''}\`` : '—';
      lines.push(`| ${loc} | ${escapeTableCell(truncate(r.message))} |`);
    }
    lines.push('');
  } else {
    lines.push(`Could not extract structured errors from the log — see the raw log above.`);
    lines.push('');
  }

  console.log(lines.join('\n'));
}

main();
