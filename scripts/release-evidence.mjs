import { readFileSync, renameSync, writeFileSync } from 'node:fs';

const ALLOWED_RESULTS = new Set(['VERIFIED', 'SUCCEEDED', 'FAILED', 'NOT_VERIFIED', 'UNKNOWN']);
const VALID_ENVIRONMENTS = new Set(['backup', 'production']);
const shaPattern = /^[0-9a-f]{7,64}$/i;
const functionNamePattern = /^[A-Za-z][A-Za-z0-9_]{0,99}$/;

export function requiredFunctionsFromManifest(manifest) {
  const declared = manifest?.required_functions ?? manifest?.deployment_intent?.required_functions;
  if (Array.isArray(declared))
    return [...new Set(declared.filter((name) => typeof name === 'string'))];
  if (typeof declared !== 'string' || !declared.trim() || declared === 'NONE_DECLARED') return [];
  return [
    ...new Set(
      declared
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ];
}

export function validateRequiredResourceEvidence(manifest, evidence) {
  const expected = requiredFunctionsFromManifest(manifest);
  if (expected.some((name) => !functionNamePattern.test(name)))
    throw new Error('Manifest contains an invalid required function name.');
  const resources = evidence?.required_resources;
  if (!expected.length) {
    if (resources && resources.length)
      throw new Error('Evidence contains undeclared required resources.');
    return [];
  }
  if (!Array.isArray(resources))
    throw new Error('Verified evidence must include required resources.');
  if (resources.length !== expected.length)
    throw new Error('Verified evidence must cover every declared required resource.');
  const byName = new Map(resources.map((resource) => [resource?.name, resource]));
  for (const name of expected) {
    const resource = byName.get(name);
    if (!resource) throw new Error(`Required resource missing from evidence: ${name}`);
    if (resource.environment !== evidence.environment)
      throw new Error(`Required resource environment mismatch: ${name}`);
    if (resource.candidate_sha !== manifest.git_sha)
      throw new Error(`Required resource candidate mismatch: ${name}`);
    if (resource.status !== 'VERIFIED')
      throw new Error(`Required resource was not verified: ${name}`);
  }
  return expected;
}

const dateValue = (value) => {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
};

export function validateCertificationEvidence(manifest, evidence, now = Date.now()) {
  if (!manifest || manifest.schema !== 'ooh-earth.release-manifest.v3')
    throw new Error('Release evidence requires manifest v3.');
  if (!evidence || !VALID_ENVIRONMENTS.has(evidence.environment))
    throw new Error('Evidence environment must be backup or production.');
  if (!shaPattern.test(evidence.candidate_sha) || evidence.candidate_sha !== manifest.git_sha)
    throw new Error('Evidence candidate does not match manifest candidate.');
  for (const key of [
    'deployment_result',
    'certification_result',
    'public_smoke_result',
    'operational_health_result',
  ]) {
    if (!ALLOWED_RESULTS.has(evidence[key])) throw new Error(`Invalid evidence result: ${key}`);
  }
  const certifiedAt = dateValue(evidence.certified_at);
  if (!certifiedAt || certifiedAt > now)
    throw new Error('Evidence timestamp is invalid or in the future.');
  if (evidence.certification_result !== 'VERIFIED')
    throw new Error('Only VERIFIED certification evidence may be published.');
  if (evidence.deployment_result !== 'SUCCEEDED')
    throw new Error('Verified certification requires a successful deployment.');
  if (evidence.public_smoke_result !== 'VERIFIED')
    throw new Error('Verified certification requires verified public smoke evidence.');
  if (evidence.operational_health_result !== 'VERIFIED')
    throw new Error('Verified certification requires verified operational-health evidence.');
  validateRequiredResourceEvidence(manifest, evidence);
  const previous = manifest.certification_evidence?.[evidence.environment];
  if (previous?.certified_at && dateValue(previous.certified_at) > certifiedAt)
    throw new Error('Older certification evidence cannot overwrite newer evidence.');
  return {
    candidate_sha: evidence.candidate_sha,
    environment: evidence.environment,
    deployment_result: evidence.deployment_result,
    certification_result: evidence.certification_result,
    public_smoke_result: evidence.public_smoke_result,
    operational_health_result: evidence.operational_health_result,
    required_resources: evidence.required_resources || [],
    certified_at: new Date(certifiedAt).toISOString(),
  };
}

export function publishCertification(manifest, evidence, now = Date.now()) {
  const valid = validateCertificationEvidence(manifest, evidence, now);
  const environment = valid.environment;
  return {
    ...manifest,
    certification_evidence: { ...(manifest.certification_evidence || {}), [environment]: valid },
    deployment_evidence: {
      ...(manifest.deployment_evidence || {}),
      [environment]: {
        candidate_sha: valid.candidate_sha,
        deployment_result: valid.deployment_result,
        observed_at: valid.certified_at,
      },
    },
    updated_at: new Date(now).toISOString(),
  };
}

export function atomicWriteJson(path, value) {
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, path);
}

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

if (process.argv[1]?.endsWith('release-evidence.mjs')) {
  const input = argument('input');
  const output = argument('output');
  if (!input || !output) throw new Error('Usage requires --input and --output.');
  const evidence = JSON.parse(readFileSync(input, 'utf8'));
  const manifest = JSON.parse(readFileSync(output, 'utf8'));
  atomicWriteJson(output, publishCertification(manifest, evidence));
}
