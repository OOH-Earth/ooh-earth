#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertProductionGate, transitionRelease, validState } from './release-state.mjs';
import { assertBuildArtifact, redactCliOutput } from './release-utils.mjs';
import { atomicWriteJson, publishCertification } from './release-evidence.mjs';

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
  assertBuildArtifact(existsSync(resolve('dist/index.html')));
  const appId = target === 'backup' ? '6a6748e009b947cb29591871' : '6a62213cff3ccbca88c04ff5';
  try {
    const output = execFileSync(
      'npx',
      ['--yes', 'base44', '--app-id', appId, 'site', 'deploy', '--no-build', '--yes'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const safeOutput = redactCliOutput(output).trim();
    if (safeOutput) console.log(safeOutput);
  } catch (error) {
    throw new Error(redactCliOutput(`${error.stdout || ''}\n${error.stderr || ''}`).trim());
  }
  console.log(`DEPLOYMENT_ATTEMPTED target=${target} candidate=${sha}`);
  console.log(
    'Deployment success is not runtime certification; run the corresponding verify command separately.',
  );
}

function publish(target) {
  const manifest = loadManifest();
  const evidencePath = value('--evidence');
  if (!manifest || !evidencePath)
    throw new Error('Publication requires a manifest and --evidence file');
  const expectedState = target === 'backup' ? 'BACKUP_VERIFIED' : 'PRODUCTION_VERIFIED';
  if (target === 'backup' && manifest.backup?.state !== expectedState)
    throw new Error('BACKUP evidence can only publish after BACKUP_VERIFIED');
  if (
    target === 'production' &&
    !['PRODUCTION_VERIFIED', 'CERTIFIED'].includes(manifest.release_state)
  )
    throw new Error('Production evidence can only publish after PRODUCTION_VERIFIED');
  const evidence = JSON.parse(readFileSync(resolve(evidencePath), 'utf8'));
  if (evidence.environment !== target)
    throw new Error(`Evidence environment does not match publish target: ${target}`);
  const published = publishCertification(manifest, evidence);
  if (target === 'production') {
    published.release_state = 'CERTIFIED';
    published.production = { ...(published.production || {}), state: 'CERTIFIED' };
  }
  if (!has('--execute')) {
    console.log(
      JSON.stringify(
        {
          mode: 'DRY_RUN',
          target,
          candidate_sha: published.git_sha,
          certification: published.certification_evidence[target],
          production_mutation: 'NOT_PERFORMED',
        },
        null,
        2,
      ),
    );
    return;
  }
  assertBuildArtifact(existsSync(resolve('dist/index.html')));
  const originalManifest = readFileSync(manifestPath, 'utf8');
  atomicWriteJson(manifestPath, published);
  const appId = target === 'backup' ? '6a6748e009b947cb29591871' : '6a62213cff3ccbca88c04ff5';
  try {
    const output = execFileSync(
      'npx',
      ['--yes', 'base44', '--app-id', appId, 'site', 'deploy', '--no-build', '--yes'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const safeOutput = redactCliOutput(output).trim();
    if (safeOutput) console.log(safeOutput);
  } catch (error) {
    writeFileSync(manifestPath, originalManifest);
    throw new Error(redactCliOutput(`${error.stdout || ''}\n${error.stderr || ''}`).trim());
  }
  console.log(`CERTIFICATION_PUBLISHED target=${target} candidate=${published.git_sha}`);
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
  } else if (command === 'publish:backup') {
    publish('backup');
  } else if (command === 'publish:production') {
    publish('production');
  } else {
    throw new Error(
      'Commands: status, plan, transition, deploy:backup, deploy:production, publish:backup, publish:production',
    );
  }
} catch (error) {
  console.error(`RELEASE_BLOCKED: ${error.message}`);
  process.exitCode = 1;
}
