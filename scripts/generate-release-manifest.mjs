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
  schema: 'ooh-earth.release-manifest.v1',
  git_sha: gitSha,
  pr: read('RELEASE_PR', 'UNKNOWN'),
  timestamp: new Date().toISOString(),
  ci: read('RELEASE_CI'),
  backup_verification: read('RELEASE_BACKUP_VERIFICATION'),
  production_verification: read('RELEASE_PRODUCTION_VERIFICATION'),
  observability_status: read('RELEASE_OBSERVABILITY_STATUS'),
  rollback_readiness: read('RELEASE_ROLLBACK_READINESS'),
};

const output = process.argv[2];
if (output) {
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
} else {
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}
