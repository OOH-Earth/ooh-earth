import { readFileSync, writeFileSync } from 'node:fs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index].startsWith('--'))
    args.set(process.argv[index].slice(2), process.argv[index + 1]);
}
const required = [
  'input',
  'output',
  'environment',
  'candidate',
  'deployment-result',
  'certification-result',
  'public-smoke-result',
  'operational-health-result',
  'observed-at',
];
const missing = required.filter((key) => !args.get(key));
if (missing.length) throw new Error(`Missing release evidence fields: ${missing.join(', ')}`);
if (!['backup', 'production'].includes(args.get('environment')))
  throw new Error('Environment must be backup or production.');
const manifest = JSON.parse(readFileSync(args.get('input'), 'utf8'));
if (manifest.schema !== 'ooh-earth.release-manifest.v3')
  throw new Error('Release evidence requires manifest v3.');
if (manifest.git_sha !== args.get('candidate'))
  throw new Error('Evidence candidate does not match manifest candidate.');
const environment = args.get('environment');
const evidence = {
  candidate_sha: args.get('candidate'),
  environment,
  deployment_result: args.get('deployment-result'),
  certification_result: args.get('certification-result'),
  public_smoke_result: args.get('public-smoke-result'),
  operational_health_result: args.get('operational-health-result'),
  certified_at: args.get('observed-at'),
};
const next = {
  ...manifest,
  certification_evidence: { ...(manifest.certification_evidence || {}), [environment]: evidence },
  deployment_evidence: {
    ...(manifest.deployment_evidence || {}),
    [environment]: {
      candidate_sha: evidence.candidate_sha,
      deployment_result: evidence.deployment_result,
      observed_at: evidence.certified_at,
    },
  },
};
writeFileSync(args.get('output'), `${JSON.stringify(next, null, 2)}\n`);
