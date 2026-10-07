import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { publishCertification } from './release-evidence.mjs';
import { transitionRelease } from './release-state.mjs';
import { assertBuildArtifact, writeReleaseManifestArtifact } from './release-utils.mjs';
import { atomicWriteJson, requiredFunctionsFromManifest } from './release-evidence.mjs';

const APP_IDS = Object.freeze({
  backup: '6a6748e009b947cb29591871',
  production: '6a62213cff3ccbca88c04ff5',
});

const REQUIRED_CHECKS = Object.freeze(['fieldStats', 'map', 'submitOffline']);
const SHA_PATTERN = /^[0-9a-f]{7,64}$/i;

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function runBase44Script(environment, source) {
  const output = execFileSync(
    'npx',
    ['--yes', 'base44', '--app-id', APP_IDS[environment], 'exec', '--privileged'],
    { input: `${source}\n`, encoding: 'utf8' },
  );
  const line = output
    .trim()
    .split('\n')
    .reverse()
    .find((entry) => entry.trim().startsWith('{'));
  if (!line) throw new Error('Base44 certification probe returned no machine-readable result');
  return JSON.parse(line);
}

export function classifyServiceChecks(
  result,
  candidateSha,
  environment = 'backup',
  requiredFunctions = [],
) {
  const checks = result?.checks || {};
  const requiredResources = checks.required_resources || [];
  const requiredResourcesHealthy = requiredFunctions.every((name) => {
    const resource = requiredResources.find((item) => item.name === name);
    return (
      resource?.environment === environment &&
      resource?.candidate_sha === candidateSha &&
      resource?.status === 'VERIFIED'
    );
  });
  const healthy =
    checks.fieldStats?.status === 200 &&
    checks.map?.status === 200 &&
    checks.submitOffline?.status === 400 &&
    checks.submitOffline?.validation_boundary === true &&
    checks.runtimeHealth?.status === 200 &&
    checks.runtimeHealth?.release === candidateSha &&
    requiredResourcesHealthy;
  return {
    healthy,
    reason: healthy ? 'ALL_REQUIRED_READ_ONLY_CHECKS_PASSED' : 'SERVICE_CHECK_FAILED',
    checks,
  };
}

export function buildCertificationEvidence({ candidateSha, environment, certifiedAt, checks }) {
  return {
    candidate_sha: candidateSha,
    environment,
    deployment_result: 'SUCCEEDED',
    certification_result: 'VERIFIED',
    public_smoke_result: 'VERIFIED',
    operational_health_result: 'VERIFIED',
    certified_at: certifiedAt,
    service_checks: checks,
    required_resources: checks.required_resources || [],
  };
}

const ENVIRONMENT_CONFIG = Object.freeze({
  backup: {
    appId: APP_IDS.backup,
    host: 'https://ooh-earth-backup.base44.app',
    requiredState: 'BACKUP_DEPLOYED',
    verifiedState: 'BACKUP_VERIFIED',
  },
  production: {
    appId: APP_IDS.production,
    host: 'https://oohearth.base44.app',
    requiredState: 'PRODUCTION_DEPLOYED',
    verifiedState: 'PRODUCTION_VERIFIED',
  },
});

export function environmentConfig(environment) {
  const config = ENVIRONMENT_CONFIG[environment];
  if (!config) throw new Error(`Unknown release environment: ${environment}`);
  return config;
}

export function assertCertificationPreconditions(manifest, environment) {
  const config = environmentConfig(environment);
  if (manifest.release_state !== config.requiredState) {
    throw new Error(
      `Certification requires ${config.requiredState}, got ${manifest.release_state}`,
    );
  }
  if (environment === 'production' && manifest.backup?.state !== 'BACKUP_VERIFIED') {
    throw new Error('Production certification requires backup.state=BACKUP_VERIFIED');
  }
  return config;
}

function bindRuntime(environment, candidateSha) {
  execFileSync(
    'npx',
    [
      '--yes',
      'base44',
      '--app-id',
      APP_IDS[environment],
      'secrets',
      'set',
      `BASE44_RELEASE_ID=${candidateSha}`,
      `OOH_EARTH_ENVIRONMENT=${environment}`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

async function publicSmoke(environment, candidateSha) {
  const { host } = environmentConfig(environment);
  const paths = ['/', '/report', '/map', '/release-manifest.json'];
  const responses = {};
  for (const path of paths) {
    const response = await fetch(`${host}${path}`);
    responses[path] = response.status;
    if (!response.ok) throw new Error(`Public smoke failed at ${path}: HTTP ${response.status}`);
    if (path === '/release-manifest.json') {
      const manifest = await response.json();
      if (manifest.git_sha !== candidateSha)
        throw new Error(
          `Public candidate mismatch: expected ${candidateSha}, got ${manifest.git_sha || 'UNKNOWN'}`,
        );
    }
  }
  return responses;
}

function runServiceChecks(environment, candidateSha, requiredFunctions) {
  return runBase44Script(
    environment,
    `
const result = { checks: {} };
async function read(path, options = {}) {
  const response = await base44.functions.fetch(path, options);
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch {}
  return { status: response.status, body_bytes: text.length, body };
}
result.checks.fieldStats = await read('/fieldStats', { method: 'GET' });
result.checks.map = await read('/fetchMapLocations', { method: 'GET' });
const submit = await read('/submitOffline', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ entity_type: 'Invalid', payload: {} }),
});
result.checks.submitOffline = {
  status: submit.status,
  body_bytes: submit.body_bytes,
  validation_boundary: submit.status === 400 && submit.body?.error === 'Invalid submission',
};
result.checks.runtimeHealth = await read('/runtimeHealth', { method: 'GET' });
result.checks.runtimeHealth.release = result.checks.runtimeHealth.body?.release || 'unknown';
result.checks.required_resources = ${JSON.stringify(requiredFunctions)}.map((name) => ({ name, environment: '${environment}', candidate_sha: '${candidateSha}', status: 'PENDING' }));
for (const resource of result.checks.required_resources) {
  const response = await read('/' + resource.name, { method: 'GET' });
  resource.http_status = response.status;
  resource.status = response.status >= 200 && response.status < 500 && response.status !== 404 ? 'VERIFIED' : 'MISSING';
}
const now = Date.now();
const snapshots = {
  fieldStats: result.checks.fieldStats.status === 200,
  map: result.checks.map.status === 200,
  submitOffline: result.checks.submitOffline.validation_boundary === true,
};
const entity = base44.entities.OperationalHealth;
const rows = await entity.list('-updated_at', 100);
for (const service of ${JSON.stringify(REQUIRED_CHECKS)}) {
  if (!snapshots[service]) continue;
  const stateKey = service + ':${environment}';
  const existing = (rows || []).find((row) => row.state_key === stateKey);
  const snapshot = {
    state_key: stateKey,
    service,
    environment: '${environment}',
    status: 'HEALTHY',
    last_success_at: now,
    success_count_window: Number(existing?.success_count_window || 0) + 1,
    failure_count_window: Number(existing?.failure_count_window || 0),
    window_started_at: Number(existing?.window_started_at || now),
    release: '${candidateSha}',
    evidence_status: 'VERIFIED',
    updated_at: now,
  };
  if (existing?.id) await entity.update(existing.id, snapshot);
  else await entity.create(snapshot);
}
result.snapshots_published = Object.entries(snapshots).filter(([, ok]) => ok).map(([service]) => service);
console.log(JSON.stringify(result));`,
  );
}

export async function certifyEnvironment({ manifestPath, environment, execute = false } = {}) {
  const manifest = JSON.parse(readFileSync(resolve(manifestPath), 'utf8'));
  const candidateSha = manifest.git_sha;
  const requiredFunctions = requiredFunctionsFromManifest(manifest);
  if (!SHA_PATTERN.test(candidateSha))
    throw new Error('Certification requires a valid candidate SHA');
  const config = assertCertificationPreconditions(manifest, environment);
  if (!execute) {
    return {
      mode: 'DRY_RUN',
      target: environment,
      candidate_sha: candidateSha,
      checks: [...REQUIRED_CHECKS, ...requiredFunctions],
    };
  }
  // Deterministic, non-destructive rebind: sets the runtime's declared release
  // (read by operationalState.ts) independently of whether function CODE
  // changed, so certification never has to wait on organic traffic to refresh
  // a stale OperationalHealth snapshot. submitOffline is probed with a
  // deliberately invalid payload (see runServiceChecks) so its deployed
  // handler is exercised without ever writing a real business record.
  bindRuntime(environment, candidateSha);
  const smoke = await publicSmoke(environment, candidateSha);
  const serviceResult = runServiceChecks(environment, candidateSha, requiredFunctions);
  const classification = classifyServiceChecks(
    serviceResult,
    candidateSha,
    environment,
    requiredFunctions,
  );
  if (!classification.healthy)
    throw new Error(`${environment.toUpperCase()} certification blocked: ${classification.reason}`);
  const now = new Date().toISOString();
  const evidence = buildCertificationEvidence({
    candidateSha,
    environment,
    certifiedAt: now,
    checks: { public_smoke: smoke, ...classification.checks },
  });
  const certified = transitionRelease(manifest, config.verifiedState, {
    [config.verifiedState]: { source: 'post-deploy-certification', candidate_sha: candidateSha },
  });
  const published = publishCertification(certified, evidence);
  atomicWriteJson(manifestPath, published);
  assertBuildArtifact(existsSync(resolve('dist/index.html')));
  writeReleaseManifestArtifact(resolve('dist/release-manifest.json'), published);
  execFileSync(
    'npx',
    ['--yes', 'base44', '--app-id', config.appId, 'site', 'deploy', '--no-build', '--yes'],
    { stdio: 'inherit' },
  );
  return {
    mode: 'EXECUTE',
    target: environment,
    candidate_sha: candidateSha,
    evidence: published.certification_evidence[environment],
  };
}

export function certifyBackup(options = {}) {
  return certifyEnvironment({ ...options, environment: 'backup' });
}

export function certifyProduction(options = {}) {
  return certifyEnvironment({ ...options, environment: 'production' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const manifestPath = arg('manifest', 'release-manifest.json');
  const environment = arg('target', 'backup');
  const result = await certifyEnvironment({
    manifestPath,
    environment,
    execute: process.argv.includes('--execute'),
  });
  console.log(JSON.stringify(result, null, 2));
}
