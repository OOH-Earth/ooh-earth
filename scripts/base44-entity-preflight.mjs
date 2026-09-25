#!/usr/bin/env node
// Deterministic guard against exactly the incident this script exists
// because of: a manual `base44 entities push` run from a stale local
// checkout (22 entities on disk, missing OperationalHealth.jsonc -- added
// in PR #157, present on origin/main the whole time) nearly deleted a live
// production entity with real records. Base44's own "cannot delete: has
// existing records" refusal is what actually prevented data loss -- this
// script is the check that should have caught it before that CLI command
// ever ran, by comparing what's on disk RIGHT NOW against an explicit,
// human-approved manifest for the target environment.
//
// Pure and local: reads base44/entities/*.jsonc and a config/ manifest
// file, does string comparison, exits non-zero on any mismatch. Never
// invokes Base44, never touches the network, never reads or prints a
// secret. Safe to run in CI or as a human's own pre-push habit.

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ENTITIES_DIR = path.join(REPO_ROOT, 'base44', 'entities');
const TARGETS = {
  backup: path.join(REPO_ROOT, 'config', 'base44-entities.backup.json'),
  production: path.join(REPO_ROOT, 'config', 'base44-entities.production.json'),
};

export function readLocalEntityManifest(entitiesDir = ENTITIES_DIR) {
  return readdirSync(entitiesDir)
    .filter((name) => name.endsWith('.jsonc'))
    .map((name) => name.replace(/\.jsonc$/, ''))
    .sort();
}

export function readApprovedManifest(target, targets = TARGETS) {
  const configPath = targets[target];
  if (!configPath) {
    throw new Error(
      `Unknown target "${target}". Valid targets: ${Object.keys(targets).join(', ')}`,
    );
  }
  const parsed = JSON.parse(readFileSync(configPath, 'utf8'));
  if (!Array.isArray(parsed.entities)) {
    throw new Error(`${configPath} is missing an "entities" array`);
  }
  return { ...parsed, entities: [...parsed.entities].sort() };
}

// Never invokes Base44 -- pure set comparison between two already-loaded
// name lists. `additions` = present locally, absent from the approved
// manifest (would be CREATED). `removals` = present in the approved
// manifest, absent locally (would be DELETED -- the dangerous direction,
// exactly what almost happened to OperationalHealth).
export function diffManifests(localNames, approvedNames) {
  const local = new Set(localNames);
  const approved = new Set(approvedNames);
  const additions = localNames.filter((name) => !approved.has(name)).sort();
  const removals = approvedNames.filter((name) => !local.has(name)).sort();
  return { additions, removals, matches: additions.length === 0 && removals.length === 0 };
}

export function runPreflight(target, options = {}) {
  const local = readLocalEntityManifest(options.entitiesDir);
  const approved = readApprovedManifest(target, options.targets);
  const diff = diffManifests(local, approved.entities);
  return {
    target,
    app_id: approved.app_id,
    local_count: local.length,
    local_manifest: local,
    approved_count: approved.entities.length,
    approved_manifest: approved.entities,
    ...diff,
  };
}

function main() {
  const target = process.argv[2];
  if (!target || !TARGETS[target]) {
    console.error(
      `Usage: node scripts/base44-entity-preflight.mjs <${Object.keys(TARGETS).join('|')}>`,
    );
    process.exitCode = 2;
    return;
  }
  const result = runPreflight(target);
  console.log(
    JSON.stringify(
      {
        target: result.target,
        app_id: result.app_id,
        local_count: result.local_count,
        approved_count: result.approved_count,
        additions: result.additions,
        removals: result.removals,
        verdict: result.matches ? 'MANIFEST_MATCH' : 'MISMATCH_BLOCKED',
      },
      null,
      2,
    ),
  );
  if (!result.matches) {
    console.error(
      `PREFLIGHT_BLOCKED: local base44/entities/ does not match the approved ${result.target} manifest. ` +
        `Do not run \`entities push\` against ${result.app_id} until this is reconciled -- ` +
        `a removal here means a push would attempt to DELETE that entity remotely.`,
    );
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
