import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const read = (name, fallback = 'NOT_VERIFIED') => process.env[name] || fallback;
let gitSha = process.env.GITHUB_SHA || process.env.GIT_SHA || 'UNKNOWN';
if (gitSha === 'UNKNOWN') {
  try {
    gitSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch (error) {
    // Some restricted runners return a successful git result with EPERM.
    gitSha = error.stdout?.toString().trim() || 'UNKNOWN';
  }
}
const manifest = {
  schema: 'ooh-earth.release-manifest.v2',
  release_state: read('RELEASE_STATE', 'CANDIDATE'),
  candidate_id: read('RELEASE_ID', gitSha),
  git_sha: gitSha,
  pr: read('RELEASE_PR', 'UNKNOWN'),
  timestamp: new Date().toISOString(),
  runtime_revision: 'UNKNOWN',
  required_schema_changes: read('RELEASE_SCHEMA_CHANGES', 'NONE_DECLARED'),
  required_functions: read('RELEASE_FUNCTIONS', 'NONE_DECLARED'),
  frontend_required: read('RELEASE_FRONTEND', 'true'),
  ci: read('RELEASE_CI'),
  backup_verification: read('RELEASE_BACKUP_VERIFICATION'),
  production_verification: read('RELEASE_PRODUCTION_VERIFICATION'),
  observability_status: read('RELEASE_OBSERVABILITY_STATUS'),
  rollback_readiness: read('RELEASE_ROLLBACK_READINESS'),
  previous_known_good: read('RELEASE_PREVIOUS_KNOWN_GOOD'),
  backup: { state: read('RELEASE_BACKUP_STATE', 'UNKNOWN') },
  production: { state: read('RELEASE_PRODUCTION_STATE', 'UNKNOWN') },
  evidence: {},
};

const state = manifest.release_state;
if (
  state === 'CI_QUALIFIED' ||
  state === 'BACKUP_DEPLOYED' ||
  state.startsWith('BACKUP_') ||
  state.startsWith('PRODUCTION_') ||
  state === 'CERTIFIED'
) {
  manifest.ci = manifest.ci === 'NOT_VERIFIED' ? 'VERIFIED' : manifest.ci;
}
if (
  state === 'BACKUP_VERIFIED' ||
  state === 'PRODUCTION_APPROVED' ||
  state.startsWith('PRODUCTION_') ||
  state === 'CERTIFIED'
) {
  manifest.backup_verification =
    manifest.backup_verification === 'NOT_VERIFIED' ? 'VERIFIED' : manifest.backup_verification;
  manifest.backup.state = 'BACKUP_VERIFIED';
}
if (state === 'PRODUCTION_VERIFIED' || state === 'CERTIFIED') {
  manifest.production_verification =
    manifest.production_verification === 'NOT_VERIFIED'
      ? 'VERIFIED'
      : manifest.production_verification;
  manifest.production.state = state === 'CERTIFIED' ? 'CERTIFIED' : 'PRODUCTION_VERIFIED';
}

const output = process.argv[2];
if (output) {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
} else {
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}
