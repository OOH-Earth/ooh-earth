#!/usr/bin/env bash
# Owner-terminal BACKUP handoff. Source candidate is independent of this script's commit.
set -euo pipefail

MODE="${1:-validate}"
[[ "$MODE" == validate || "$MODE" == deploy ]] || { echo 'Use validate or deploy'; exit 2; }
export CANDIDATE_SHA=b57cc4645592f6e696f917fc860d672c397895b0
export BACKUP_APP_ID=6a6748e009b947cb29591871
export PROD_APP_ID=6a62213cff3ccbca88c04ff5
export EVIDENCE_DIR
EVIDENCE_DIR="$(mktemp -d "${OOH_EVIDENCE_ROOT:-/tmp}/ooh-place-backup.XXXXXX")"
echo "Evidence: $EVIDENCE_DIR"
trap 'code=$?; echo "Exit: $code; evidence retained: $EVIDENCE_DIR"; exit "$code"' EXIT
{
node -e 'if(Number(process.versions.node.split(".")[0])<20)throw Error("Node 20+ required")'

# No reads or edits of the owner's existing repository or unpublished work.
git clone --no-checkout https://github.com/OOH-Earth/ooh-earth.git "$EVIDENCE_DIR/source"
cd "$EVIDENCE_DIR/source"
git checkout --detach "$CANDIDATE_SHA"
git merge-base --is-ancestor df43402ce2d33c015e7b153c20a14113371a7077 HEAD
git merge-base --is-ancestor 13bffdecce4c423918f04fd7b83b2607a71a5278 HEAD
npm ci
GITHUB_SHA="$CANDIDATE_SHA" GIT_SHA="$CANDIDATE_SHA" RELEASE_ID="$CANDIDATE_SHA" \
  RELEASE_STATE=CANDIDATE VITE_BASE44_APP_ID="$BACKUP_APP_ID" \
  VITE_BASE44_APP_BASE_URL='' VITE_BASE44_FUNCTIONS_VERSION='' npm run build
node --test src/lib/placeResearch.test.mjs

node --input-type=module - <<'JS'
import fs from 'node:fs';
import crypto from 'node:crypto';
const html = fs.readFileSync('dist/index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)]
  .map(match => match[1]).filter(src => /^\/assets\/index-[^/]+\.js$/.test(src));
if (scripts.length !== 1) throw Error('Expected exactly one true entry');
const entry = scripts[0];
const bytes = fs.readFileSync(`dist${entry}`);
const source = bytes.toString();
const backup = `appId:"${process.env.BACKUP_APP_ID}"`;
const prod = `appId:"${process.env.PROD_APP_ID}"`;
if (source.split(backup).length - 1 !== 1 || source.includes(prod))
  throw Error('SDK target proof failed; do not deploy');
const manifest = JSON.parse(fs.readFileSync('dist/release-manifest.json', 'utf8'));
const identities = [manifest.git_sha, manifest.candidate_id, manifest.build_identity?.candidate_sha,
  manifest.deployment_evidence?.backup?.candidate_sha, manifest.deployment_evidence?.production?.candidate_sha];
if (manifest.schema !== 'ooh-earth.release-manifest.v3' || identities.some(id => id !== process.env.CANDIDATE_SHA))
  throw Error('Manifest identity proof failed');
const proof = { candidate: process.env.CANDIDATE_SHA, appId: process.env.BACKUP_APP_ID,
  entry, sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
fs.writeFileSync(`${process.env.EVIDENCE_DIR}/build-proof.json`, JSON.stringify(proof, null, 2));
console.log(proof);
JS

# Run the existing specs against deployed bytes with only QA imports adjusted in this
# disposable checkout. Fixtures/providers stay mocked; activity logs are absorbed;
# unmatched non-GET requests are blocked and fail the test. No live entity writes.
cat > e2e/fixtures/backupReleaseGuard.ts <<'TS'
import { test as base, expect } from '@playwright/test';
export * from '@playwright/test';
export { expect };
export const test = base.extend<{ releaseGuard: void }>({
  releaseGuard: [async ({ page }, use, info) => {
    const blocked: string[] = [];
    const errors: string[] = [];
    const logs: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (/\/api\/(?:apps|app-logs)\/6a62213cff3ccbca88c04ff5(?:\/|$)/.test(new URL(request.url()).pathname))
        blocked.push(`PRODUCTION RUNTIME TARGET ${request.method()}`);
    });
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (/\/api\/(?:apps|app-logs)\/6a62213cff3ccbca88c04ff5(?:\/|$)/.test(url.pathname)) {
        blocked.push(`PRODUCTION RUNTIME TARGET ${request.method()} ${url.origin}${url.pathname}`);
        return route.abort();
      }
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        if (url.pathname.startsWith('/api/app-logs/')) {
          logs.push(`${request.method()} ${url.origin}${url.pathname}`);
          return route.fulfill({ json: {} });
        }
        blocked.push(`${request.method()} ${url.origin}${url.pathname}`);
        return route.abort();
      }
      return route.fallback();
    });
    await use();
    await info.attach('network-guard', { body: JSON.stringify({ absorbedActivityLogs: logs, blocked, pageErrors: errors }), contentType: 'application/json' });
    await info.attach('rendered-preview', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    expect(blocked, 'Unexpected writes or production runtime targeting').toEqual([]);
    expect(errors, 'Rendered page errors').toEqual([]);
  }, { auto: true }],
});
TS
node --input-type=module - <<'JS'
import fs from 'node:fs';
for (const file of ['place-research', 'capture-manual-coordinates', 'ecology-map']) {
  const path = `e2e/${file}.spec.ts`;
  const source = fs.readFileSync(path, 'utf8');
  const adjusted = source.replace("from '@playwright/test';", "from './fixtures/backupReleaseGuard';");
  if (adjusted === source) throw Error(`No import adjusted: ${path}`);
  fs.writeFileSync(path, adjusted);
}
JS
cat > playwright.backup-release.config.ts <<'TS'
import { defineConfig } from '@playwright/test';
import original from './playwright.config';
export default defineConfig({ ...original, webServer: undefined, workers: 1, retries: 0,
  reporter: [['line'], ['json', { outputFile: `${process.env.EVIDENCE_DIR}/results.json` }]],
  outputDir: `${process.env.EVIDENCE_DIR}/browser-results`,
  use: { ...original.use, baseURL: 'https://ooh-earth-backup.base44.app', trace: 'on', screenshot: 'on' },
});
TS
SPECS=(e2e/place-research.spec.ts e2e/capture-manual-coordinates.spec.ts e2e/ecology-map.spec.ts)
FILTER='bounded place research|manual capture coordinates|delayed dialog autofocus|selecting an observation'
npx playwright test --config=playwright.backup-release.config.ts "${SPECS[@]}" \
  --grep "$FILTER" --list > "$EVIDENCE_DIR/test-discovery.txt"
cat "$EVIDENCE_DIR/test-discovery.txt"
grep -q 'Total: 12 tests in 3 files' "$EVIDENCE_DIR/test-discovery.txt" \
  || { echo 'Unexpected discovery count; inspect before deploying'; exit 3; }
if [[ "$MODE" == validate ]]; then
  echo 'VALIDATED: build/target/manifest/test discovery only; no browser run, Base44 command or deployment.'
  exit 0
fi

# Public GitHub read only. The pinned source commit must still have successful
# exact-head runs. A timeout, authentication wall or rate limit fails closed.
node --input-type=module - <<'JS'
import fs from 'node:fs';
const runs = [37641011927, 37641012186, 37641012022];
const evidence = [];
for (const id of runs) {
  const response = await fetch(`https://api.github.com/repos/OOH-Earth/ooh-earth/actions/runs/${id}`, {
    headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw Error(`CI lookup ${id}: HTTP ${response.status}`);
  const run = await response.json();
  if (run.head_sha !== process.env.CANDIDATE_SHA || run.status !== 'completed' || run.conclusion !== 'success')
    throw Error(`Exact-head CI gate not met: ${run.name} ${run.status}/${run.conclusion}`);
  evidence.push({ id, name: run.name, head: run.head_sha, conclusion: run.conclusion, url: run.html_url });
}
fs.writeFileSync(`${process.env.EVIDENCE_DIR}/ci-proof.json`, JSON.stringify(evidence, null, 2));
const before = await fetch('https://ooh-earth-backup.base44.app/', { cache: 'no-store', signal: AbortSignal.timeout(20000) });
if (!before.ok) throw Error(`Pre-deploy BACKUP homepage: HTTP ${before.status}`);
const priorHtml = await before.text();
const priorEntries = [...priorHtml.matchAll(/<script\b[^>]*\bsrc="(\/assets\/index-[^/]+\.js)"[^>]*>/g)].map(match => match[1]);
if (priorEntries.length !== 1) throw Error('Cannot identify previous BACKUP entry; inspect before deploy');
fs.writeFileSync(`${process.env.EVIDENCE_DIR}/pre-deploy-summary.json`, JSON.stringify({
  previousEntry: priorEntries[0], observedAt: new Date().toISOString(), target: process.env.BACKUP_APP_ID,
  note: 'Reference only: an entry filename is not a qualified rollback build',
}, null, 2));
JS
npx --yes base44@0.1.14 whoami
npx playwright install chromium
echo "BACKUP ONLY: $BACKUP_APP_ID, source $CANDIDATE_SHA"
echo 'If a sandbox classifier denies an action, STOP and report; never retry through another tool/host.'
read -r -p 'Type BACKUP to deploy the frontend only: ' CONFIRM
[[ "$CONFIRM" == BACKUP ]] || { echo 'Aborted; nothing deployed'; exit 5; }
npx --yes base44@0.1.14 site deploy --no-build --yes --app-id "$BACKUP_APP_ID" \
  2>&1 | tee "$EVIDENCE_DIR/deploy.log"

node --input-type=module - <<'JS'
import fs from 'node:fs';
const proof = JSON.parse(fs.readFileSync(`${process.env.EVIDENCE_DIR}/build-proof.json`, 'utf8'));
const origin = 'https://ooh-earth-backup.base44.app';
const deadline = Date.now() + 180000;
let lastError;
for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    const get = async path => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw Error('Propagation deadline exceeded');
      const response = await fetch(`${origin}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(Math.min(15000, remaining)) });
      if (!response.ok) throw Error(`HTTP ${response.status}: ${path}`);
      return Buffer.from(await response.arrayBuffer());
    };
    const html = (await get(`/?release-check=${Date.now()}`)).toString();
    if (!html.includes(`src="${proof.entry}"`)) throw Error('Homepage entry has not propagated');
    const chunks = fs.readdirSync('dist/assets').filter(path => path.endsWith('.js'));
    let next = 0;
    await Promise.all(Array.from({ length: 6 }, async () => { while (next < chunks.length) {
      const path = chunks[next++];
      // Verify every JS chunk, including the lazily loaded research panel.
      const local = fs.readFileSync(`dist/assets/${path}`);
      const live = await get(`/assets/${path}`);
      if (!local.equals(live)) throw Error(`Live byte mismatch: ${path}`);
    } }));
    const liveManifest = JSON.parse((await get(`/release-manifest.json?release-check=${Date.now()}`)).toString());
    if (liveManifest.git_sha !== proof.candidate || liveManifest.candidate_id !== proof.candidate)
      throw Error('Live manifest identity mismatch');
    fs.writeFileSync(`${process.env.EVIDENCE_DIR}/live-proof.json`, JSON.stringify({ ...proof,
      observedAt: new Date().toISOString(), allJsChunksMatched: true }, null, 2));
    console.log('Live homepage, all JavaScript chunks and manifest match the pinned BACKUP build.');
    lastError = undefined;
    break;
  } catch (error) {
    lastError = error;
    console.log(`Propagation attempt ${attempt}/12: ${error.message}`);
    if (Date.now() >= deadline) throw error;
    if (attempt < 12) await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
if (lastError) throw lastError;
JS
npx playwright test --config=playwright.backup-release.config.ts "${SPECS[@]}" \
  --grep "$FILTER" --workers=1 --retries=0 --trace=on \
  2>&1 | tee "$EVIDENCE_DIR/playwright.log"
node --input-type=module - <<'JS'
import fs from 'node:fs';
const report = JSON.parse(fs.readFileSync(`${process.env.EVIDENCE_DIR}/results.json`, 'utf8'));
const stats = report.stats;
if (stats.expected !== 12 || stats.unexpected || stats.flaky || stats.skipped || report.errors?.length)
  throw Error(`Browser gate failed: ${JSON.stringify(stats)}`);
console.log('12/12 deployed-artifact browser checks passed, zero retries. Data/providers were mocked; this is not natural live-source or physical-phone qualification.');
JS
echo "BACKUP evidence ready: $EVIDENCE_DIR. Production remains outside this script."
} 2>&1 | tee "$EVIDENCE_DIR/session.log"
