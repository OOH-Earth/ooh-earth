const APP_IDS = Object.freeze({
  backup: '6a6748e009b947cb29591871',
  production: '6a62213cff3ccbca88c04ff5',
});

const RETRYABLE_STATUSES = new Set([502, 503, 504]);

export function healthEndpoint(environment, candidateSha) {
  const appId = APP_IDS[environment];
  if (!appId) throw new Error(`Unknown release environment: ${environment}`);
  const url = new URL(`https://base44.app/api/apps/${appId}/functions/operationalHealth`);
  url.searchParams.set('environment', environment);
  if (candidateSha) url.searchParams.set('candidate_sha', candidateSha);
  return url.toString();
}

export function classifyHealthResponse({ status, payload, environment, candidateSha }) {
  const reason =
    payload?.reason_code ||
    (status === 401
      ? 'AUTHENTICATION_FAILURE'
      : status === 403
        ? 'AUTHORIZATION_FAILURE'
        : status === 404
          ? 'ENDPOINT_NOT_FOUND'
          : 'HEALTH_ENDPOINT_FAILURE');
  const retryable = RETRYABLE_STATUSES.has(status) || payload?.retryable === true;
  return {
    environment,
    candidate_sha: candidateSha || null,
    http_status: status,
    status: payload?.status || 'UNKNOWN',
    evidence_status: payload?.evidence_status || 'NOT_VERIFIED',
    reason_code: reason,
    retryable,
    checked_at: new Date().toISOString(),
    evidence_age_ms: payload?.generated_at ? Math.max(0, Date.now() - payload.generated_at) : null,
    services: Array.isArray(payload?.services) ? payload.services : [],
  };
}

export function fetchHealthViaBase44Cli(environment, candidateSha) {
  const query = new URLSearchParams({ environment });
  if (candidateSha) query.set('candidate_sha', candidateSha);
  const script = `const r = await base44.functions.fetch('/operationalHealth?${query}', { method: 'GET' }); console.log(JSON.stringify({ status: r.status, body: await r.text() }));`;
  const output = execFileSync(
    'npx',
    ['--yes', 'base44', '--app-id', APP_IDS[environment], 'exec', '--privileged'],
    { input: `${script}\n`, encoding: 'utf8' },
  );
  const line = output
    .trim()
    .split('\n')
    .reverse()
    .find((entry) => entry.trim().startsWith('{'));
  if (!line) throw new Error('Base44 CLI health probe returned no machine-readable result');
  const result = JSON.parse(line);
  return new Response(result.body, {
    status: result.status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function fetchHealthWithRetry({
  environment,
  candidateSha,
  token,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  attempts = 3,
} = {}) {
  if (!token && fetchImpl === fetch)
    throw new Error('Health diagnostics require an authenticated fetch path');
  const boundedAttempts = Math.max(1, Math.min(3, Number(attempts) || 1));
  let diagnostic;
  for (let attempt = 1; attempt <= boundedAttempts; attempt++) {
    let response;
    try {
      response = await fetchImpl(healthEndpoint(environment, candidateSha), {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'X-App-Id': APP_IDS[environment],
        },
      });
    } catch (error) {
      diagnostic = {
        environment,
        candidate_sha: candidateSha || null,
        http_status: 0,
        status: 'UNKNOWN',
        evidence_status: 'INSUFFICIENT_DATA',
        reason_code: 'HEALTH_ENDPOINT_UNREACHABLE',
        retryable: true,
        checked_at: new Date().toISOString(),
        evidence_age_ms: null,
        services: [],
        error: error?.message || 'network failure',
      };
      if (attempt < boundedAttempts) {
        await sleep(250 * 2 ** (attempt - 1));
        continue;
      }
      return { ...diagnostic, attempts: attempt };
    }
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    diagnostic = {
      ...classifyHealthResponse({ status: response.status, payload, environment, candidateSha }),
      attempts: attempt,
    };
    if (!diagnostic.retryable || attempt === boundedAttempts) return diagnostic;
    await sleep(250 * 2 ** (attempt - 1));
  }
  return diagnostic;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const environment = process.argv.includes('--production') ? 'production' : 'backup';
  const shaIndex = process.argv.indexOf('--sha');
  const candidateSha = shaIndex >= 0 ? process.argv[shaIndex + 1] : undefined;
  const result = await fetchHealthWithRetry({
    environment,
    candidateSha,
    fetchImpl: (url) => fetchHealthViaBase44Cli(environment, candidateSha),
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'HEALTHY' || result.evidence_status !== 'VERIFIED') process.exitCode = 1;
}
import { execFileSync } from 'node:child_process';
