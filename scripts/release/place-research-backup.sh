#!/usr/bin/env bash
# Owner-terminal BACKUP handoff. Source candidate is independent of this script's commit.
# The candidate is a commit on main; its exact-head CI is discovered by commit SHA, not by PR.
set -euo pipefail

MODE="${1:-validate}"
[[ "$MODE" == validate || "$MODE" == deploy ]] || { echo 'Use validate or deploy'; exit 2; }
export CANDIDATE_SHA=4fb6cad3c2c908be7f9d559ea825e363f9a9e240
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
# Every merge that makes up the combined candidate must be in its history.
for ancestor in beadb9878229cd1841d9a99512d2928b19eab25b 7877f0598b4c4d3983d5e98cb8b9ab42edb54edb \
  4d7db218981984609d18780b3158e32d89f7650d 9adcf92550245eb2401601380532e1eb77a5433f; do
  git merge-base --is-ancestor "$ancestor" HEAD
done
# Historical b57cc46 was a pre-squash head and is intentionally not required.
node -e '
const lock = require("./package-lock.json").packages;
const need = { moment: "2.31.0", dompurify: "3.4.16", "source-map-js": "1.2.2" };
for (const [name, version] of Object.entries(need))
  if (lock[`node_modules/${name}`]?.version !== version) throw Error(`lockfile ${name} is not ${version}`);
const fs = require("fs");
for (const file of ["src/lib/hydro/hydroApi.js", "src/lib/placeResearch.js", "e2e/rivers-observed.spec.ts"])
  if (!fs.existsSync(file)) throw Error(`missing ${file}`);
if (/InvokeLLM/.test(fs.readFileSync("src/components/ooh/map/layers/useMushroomData.js", "utf8")))
  throw Error("model-generated map coordinates are back in the mushroom hook");
'
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
for (const file of ['place-research', 'capture-manual-coordinates', 'ecology-map', 'rivers-observed', 'main-map-generated-layers']) {
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
SPECS=(e2e/place-research.spec.ts e2e/capture-manual-coordinates.spec.ts e2e/ecology-map.spec.ts
  e2e/rivers-observed.spec.ts e2e/main-map-generated-layers.spec.ts)
FILTER='bounded place research|manual capture coordinates|delayed dialog autofocus|selecting an observation|observed stations|AI-generated layers'
npx playwright test --config=playwright.backup-release.config.ts "${SPECS[@]}" \
  --grep "$FILTER" --list > "$EVIDENCE_DIR/test-discovery.txt"
cat "$EVIDENCE_DIR/test-discovery.txt"
grep -q 'Total: 36 tests in 5 files' "$EVIDENCE_DIR/test-discovery.txt" \
  || { echo 'Unexpected discovery count; inspect before deploying'; exit 3; }
if [[ "$MODE" == validate ]]; then
  echo 'VALIDATED: build/target/manifest/test discovery only; no browser run, Base44 command or deployment.'
  exit 0
fi

# Public GitHub read only. The pinned candidate commit must have successful exact-head runs of
# every required workflow, discovered by commit SHA (not by PR). A timeout, authentication wall,
# rate limit, failed or cancelled run, or a candidate that is not on main fails closed.
node --input-type=module - <<'JS'
import fs from 'node:fs';
const required = ['CI', 'CodeQL', 'Interaction regression (zero retries)'];
const getGithub = async path => {
  const response = await fetch(`https://api.github.com/repos/OOH-Earth/ooh-earth/${path}`, {
    headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw Error(`GitHub qualification lookup: HTTP ${response.status}`);
  return response.json();
};
const deadline = Date.now() + 1200000;
let evidence;
while (true) {
  const listing = await getGithub(`actions/runs?head_sha=${process.env.CANDIDATE_SHA}&per_page=100`);
  const all = listing.workflow_runs || [];
  if (all.some(run => run.head_sha !== process.env.CANDIDATE_SHA)) throw Error('CI head mismatch');
  const runs = all.filter(run => ['push', 'workflow_dispatch'].includes(run.event));
  const latest = required.map(name =>
    runs.filter(run => run.name === name).sort((a, b) => b.run_number - a.run_number)[0]);
  for (const run of latest.filter(Boolean)) {
    if (run.status === 'completed' && run.conclusion !== 'success')
      throw Error(`Exact-head CI failed: ${run.name}/${run.conclusion}`);
  }
  if (latest.every(run => run && run.status === 'completed' && run.conclusion === 'success')) {
    evidence = latest.map(run => ({ id: run.id, name: run.name, head: run.head_sha, conclusion: run.conclusion, url: run.html_url }));
    break;
  }
  if (Date.now() >= deadline) throw Error('Exact-head CI did not finish within 20 minutes; nothing deployed');
  console.log('Waiting for exact-head qualification:', required.map((name, i) =>
    `${name}: ${latest[i] ? latest[i].status : 'not started'}`).join('; '));
  await new Promise(resolve => setTimeout(resolve, 30000));
}
const comparison = await getGithub(`compare/${process.env.CANDIDATE_SHA}...main`);
if (!['identical', 'ahead'].includes(comparison.status))
  throw Error(`Candidate is not on main (${comparison.status}); review before deploying`);
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
if (stats.expected !== 36 || stats.unexpected || stats.flaky || stats.skipped || report.errors?.length)
  throw Error(`Browser gate failed: ${JSON.stringify(stats)}`);
console.log('36/36 deployed-artifact browser checks passed, zero retries. Data/providers were mocked; this is not natural live-source or physical-phone qualification.');
JS
# Bounded REAL-provider browser check, recorded separately from the mocked suite above. It never
# changes the qualification result: it reports whether the deployed page works against the live
# USGS Water Data and UK Environment Agency APIs right now (2 page loads, GET only, non-GET aborted).
node --input-type=module - <<'JS' || echo 'Real-provider check could not complete; recorded as unavailable, mocked result unaffected.'
import fs from 'node:fs';
import { chromium } from '@playwright/test';
const origin = 'https://ooh-earth-backup.base44.app';
const checks = [
  { name: 'USGS Water Data, Maryland/Virginia', path: '/rivers?lat=39.2&lng=-76.7&z=9', host: 'api.waterdata.usgs.gov' },
  { name: 'UK Environment Agency, Thames', path: '/rivers?lat=51.42&lng=-0.25&z=9', host: 'environment.data.gov.uk' },
];
const browser = await chromium.launch();
const results = [];
for (const check of checks) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const providerRequests = [];
  const blocked = [];
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) { blocked.push(request.method() + ' ' + url.origin + url.pathname); return route.abort(); }
    if (url.hostname === check.host) providerRequests.push(url.pathname);
    return route.continue();
  });
  const record = { check: check.name, observedAt: new Date().toISOString(), ok: false };
  try {
    await page.goto(origin + check.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const button = page.getByRole('button', { name: /observed station status/ });
    await button.waitFor({ timeout: 45000 });
    // The label carries the live count; wait for a real, non-zero result or a provider status line.
    await page.waitForFunction(() => /Observed stations . [1-9]/.test(document.body.innerText), null, { timeout: 45000 }).catch(() => {});
    record.label = (await button.innerText()).replace(/\s+/g, ' ');
    await button.click();
    record.status = (await page.getByTestId('station-status').innerText()).replace(/\s+/g, ' ').slice(0, 400);
    record.ok = /Observed stations . [1-9]/.test(record.label);
    await page.screenshot({ path: `${process.env.EVIDENCE_DIR}/real-provider-${check.host}.png` });
  } catch (error) {
    record.error = String(error.message).slice(0, 300);
  }
  record.providerRequests = providerRequests.length;
  record.blockedWrites = blocked;
  results.push(record);
  await context.close();
}
await browser.close();
fs.writeFileSync(`${process.env.EVIDENCE_DIR}/real-provider-browser.json`, JSON.stringify(results, null, 2));
console.log('REAL-PROVIDER browser check (separate from the mocked suite):');
for (const r of results) console.log(' ', r.ok ? 'OK ' : 'NOT OK', r.check, r.label || r.error || '', `provider requests: ${r.providerRequests}`);
JS
echo "BACKUP evidence ready: $EVIDENCE_DIR. Production remains outside this script."
} 2>&1 | tee "$EVIDENCE_DIR/session.log"
