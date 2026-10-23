// Offline tripwire for a GitHub Actions workflow file. Plain text scanning on purpose: no YAML
// dependency (js-yaml is only a transitive dev dep). Comments are stripped first, so prose that
// merely MENTIONS e.g. pull_request_target is fine; active configuration is not.
// LIMITS — not a YAML validator: assumes 2-space indentation and the inline `branches: [a, b]`
// form (a block-list rewrite fails loudly); rejects the scalar `permissions: write-all` at any level but
// checks scope lists only at top level (flow maps like `permissions: {contents: write}` are NOT parsed), `uses:` at line
// start and `${{ secrets.* }}` (GITHUB_TOKEN excepted); does not evaluate job conditions. It enforces the
// agreed CI policy only (no privileged triggers, no repo secrets, pinned actions, write-scope allowlist,
// maintenance trigger) — it does NOT validate YAML structure or prove least privilege in general.
// A real PR-triggered run is the authoritative evidence.

// Token write scopes the agreed CI policy allows at workflow level (read scopes are unrestricted).
const ALLOWED_WRITE_SCOPES = ['checks', 'pull-requests'];

// Remove a YAML comment from one line: a `#` at line start or after whitespace, outside quotes.
export function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i).trimEnd();
    }
  }
  return line;
}

export const activeLines = (text) => text.split('\n').map(stripComment);

// Branch globs listed under `on: pull_request: branches: [...]`; null if there is no trigger.
export function pullRequestBranches(lines) {
  const i = lines.findIndex((l) => /^ {2}pull_request:\s*$/.test(l));
  if (i < 0) return null;
  for (let j = i + 1; j < lines.length && (/^ {4}/.test(lines[j]) || lines[j] === ''); j++) {
    const m = lines[j].match(/^ {4}branches:\s*\[(.*)\]/);
    if (m) return m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
  }
  return [];
}

// Returns a list of human-readable violations (empty = clean).
export function scan(text) {
  const lines = activeLines(text);
  const problems = [];

  const b = pullRequestBranches(lines);
  if (b === null) problems.push('no `on: pull_request:` trigger');
  else {
    if (!b.includes('main')) problems.push(`main missing from pull_request branches: ${b}`);
    if (!b.includes('maintenance/**'))
      problems.push(`maintenance/** missing from pull_request branches: ${b}`);
  }

  lines.forEach((l, n) => {
    if (/pull_request_target/.test(l))
      problems.push(
        `line ${n + 1}: pull_request_target runs untrusted PRs with base-repo privileges`,
      );
    if (/workflow_run/.test(l))
      problems.push(`line ${n + 1}: workflow_run runs with base-repo privileges`);
    // Runs on comment-stripped lines and is anchored to the key, so prose / quoted text can't trip it.
    if (/^\s*permissions:\s*write-all\b/.test(l))
      problems.push(`line ${n + 1}: permissions: write-all grants every token scope`);
    // The auto-issued GITHUB_TOKEN is not a repository secret; any other secrets.* is.
    if (/\$\{\{\s*secrets\.(?!GITHUB_TOKEN\b)/.test(l))
      problems.push(`line ${n + 1}: CI must not reference secrets`);
    if (/^\s*-?\s*uses:/.test(l) && !/@[0-9a-f]{40}\b/.test(l))
      problems.push(`line ${n + 1}: action not pinned to a full commit SHA: ${l.trim()}`);
  });

  const p = lines.findIndex((l) => /^permissions:\s*$/.test(l));
  if (p < 0) problems.push('no top-level permissions block');
  else {
    const writes = [];
    for (let j = p + 1; j < lines.length && /^ {2}\S/.test(lines[j]); j++) {
      const m = lines[j].trim().match(/^([\w-]+):\s*write$/);
      if (m) writes.push(m[1]);
    }
    // Policy is an allowlist of write scopes (a subset is fine; anything else is not).
    const extra = writes.filter((w) => !ALLOWED_WRITE_SCOPES.includes(w));
    if (extra.length) problems.push(`unexpected token write scopes: ${extra}`);
  }
  return problems;
}
