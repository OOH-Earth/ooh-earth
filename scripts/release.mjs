#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertProductionGate, transitionRelease, validState } from './release-state.mjs';

const args = process.argv.slice(2);
const command = args[0] || 'status';
const value = (flag, fallback = undefined) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] || fallback : fallback;
};
const has = (flag) => args.includes(flag);
const manifestPath = resolve(value('--manifest', 'release-manifest.json'));

function gitSha() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function loadManifest() {
  if (!existsSync(manifestPath)) return null;
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

function printPlan(target, sha) {
  console.log(
    JSON.stringify(
      {
        mode: 'DRY_RUN',
        target,
        candidate_sha: sha,
        runtime_revision: 'UNKNOWN',
        frontend: 'site/dist',
        schema_changes: 'NONE_DECLARED',
        function_changes: 'NONE_DECLARED',
        backup_gate: target === 'production' ? 'BACKUP_VERIFIED_REQUIRED' : 'NOT_REQUIRED',
        production_mutation: 'NOT_PERFORMED',
      },
      null,
      2,
    ),
  );
}

function deploy(target) {
  const sha = gitSha();
  const manifest = loadManifest();
  if (!manifest || manifest.git_sha !== sha)
    throw new Error('Manifest candidate does not match current HEAD');
  if (target === 'production') assertProductionGate(manifest);
  if (!has('--execute')) {
    printPlan(target, sha);
    return;
  }
  const appId = target === 'backup' ? '6a6748e009b947cb29591871' : '6a62213cff3ccbca88c04ff5';
  execFileSync(
    'npx',
    ['--yes', 'base44', '--app-id', appId, 'site', 'deploy', '--no-build', '--yes'],
    { stdio: 'inherit' },
  );
  console.log(`DEPLOYMENT_ATTEMPTED target=${target} candidate=${sha}`);
  console.log(
    'Deployment success is not runtime certification; run the corresponding verify command separately.',
  );
}

try {
  if (command === 'status') {
    const manifest = loadManifest();
    console.log(
      JSON.stringify(
        manifest || { release_state: 'CANDIDATE', git_sha: gitSha(), runtime_revision: 'UNKNOWN' },
        null,
        2,
      ),
    );
  } else if (command === 'plan') {
    const target = value('--target', 'backup');
    if (!['backup', 'production'].includes(target))
      throw new Error('Target must be backup or production');
    printPlan(target, value('--sha', gitSha()));
  } else if (command === 'transition') {
    const to = value('--to');
    if (!validState(to)) throw new Error(`Unknown release state: ${to}`);
    const current = loadManifest();
    if (!current) throw new Error(`Manifest not found: ${manifestPath}`);
    const next = transitionRelease(current, to, { [to]: { source: 'release-cli' } });
    writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`RELEASE_STATE ${current.release_state || 'CANDIDATE'} -> ${to}`);
  } else if (command === 'deploy:backup') {
    deploy('backup');
  } else if (command === 'deploy:production') {
    deploy('production');
  } else {
    throw new Error('Commands: status, plan, transition, deploy:backup, deploy:production');
  }
} catch (error) {
  console.error(`RELEASE_BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
