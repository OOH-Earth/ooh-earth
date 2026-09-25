import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  readLocalEntityManifest,
  readApprovedManifest,
  diffManifests,
  runPreflight,
} from './base44-entity-preflight.mjs';

function makeFixture(entityNames, approvedNames, appId = 'app_test') {
  const root = mkdtempSync(path.join(tmpdir(), 'entity-preflight-'));
  const entitiesDir = path.join(root, 'entities');
  const configDir = path.join(root, 'config');
  mkdirSync(entitiesDir, { recursive: true });
  mkdirSync(configDir, { recursive: true });
  for (const name of entityNames) {
    writeFileSync(path.join(entitiesDir, `${name}.jsonc`), '{}');
  }
  // A non-.jsonc file in the directory (mirrors the real
  // base44/entities/User.test.mjs) must never be counted as an entity.
  writeFileSync(path.join(entitiesDir, 'README.md'), 'not an entity');
  const approvedPath = path.join(configDir, 'approved.json');
  writeFileSync(approvedPath, JSON.stringify({ app_id: appId, entities: approvedNames }));
  return {
    root,
    entitiesDir,
    approvedPath,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test('readLocalEntityManifest only counts .jsonc files, sorted', () => {
  const fx = makeFixture(['User', 'AccessLog', 'FieldCheck'], ['User']);
  try {
    assert.deepEqual(readLocalEntityManifest(fx.entitiesDir), ['AccessLog', 'FieldCheck', 'User']);
  } finally {
    fx.cleanup();
  }
});

test('diffManifests: identical sets match, no additions or removals', () => {
  const diff = diffManifests(['A', 'B', 'C'], ['C', 'B', 'A']);
  assert.equal(diff.matches, true);
  assert.deepEqual(diff.additions, []);
  assert.deepEqual(diff.removals, []);
});

// This is the exact shape of the incident this script exists to prevent:
// a local checkout missing an entity that's approved (and live, with real
// records) remotely. `removals` must surface it, and matches must be false.
test('diffManifests: a locally-missing approved entity is a removal (the deletion-risk case)', () => {
  const diff = diffManifests(['AccessLog', 'User'], ['AccessLog', 'OperationalHealth', 'User']);
  assert.equal(diff.matches, false);
  assert.deepEqual(diff.removals, ['OperationalHealth']);
  assert.deepEqual(diff.additions, []);
});

test('diffManifests: a new local-only entity is an addition, not a removal', () => {
  const diff = diffManifests(['AccessLog', 'NewEntity', 'User'], ['AccessLog', 'User']);
  assert.equal(diff.matches, false);
  assert.deepEqual(diff.additions, ['NewEntity']);
  assert.deepEqual(diff.removals, []);
});

test('readApprovedManifest rejects an unknown target', () => {
  assert.throws(
    () => readApprovedManifest('staging', { backup: '/nonexistent' }),
    /Unknown target/,
  );
});

test('runPreflight: end-to-end match against a fixture manifest', () => {
  const fx = makeFixture(['AccessLog', 'User'], ['User', 'AccessLog'], 'app_123');
  try {
    const result = runPreflight('fixture', {
      entitiesDir: fx.entitiesDir,
      targets: { fixture: fx.approvedPath },
    });
    assert.equal(result.matches, true);
    assert.equal(result.app_id, 'app_123');
    assert.equal(result.local_count, 2);
  } finally {
    fx.cleanup();
  }
});

test('runPreflight: end-to-end mismatch surfaces the exact OperationalHealth-shaped incident', () => {
  const fx = makeFixture(['AccessLog', 'User'], ['AccessLog', 'OperationalHealth', 'User']);
  try {
    const result = runPreflight('fixture', {
      entitiesDir: fx.entitiesDir,
      targets: { fixture: fx.approvedPath },
    });
    assert.equal(result.matches, false);
    assert.deepEqual(result.removals, ['OperationalHealth']);
  } finally {
    fx.cleanup();
  }
});

// The real, current manifests -- guards against config/*.json drifting
// from base44/entities/ silently (e.g. someone adds a new entity file and
// forgets to update the approved list, which would otherwise fail closed
// for a legitimate reason but with a confusing "why" until someone reads
// this test).
test('real repo: local base44/entities/ currently matches the approved backup manifest', () => {
  const result = runPreflight('backup');
  assert.deepEqual(
    result.removals,
    [],
    'An entity was removed from base44/entities/ without updating config/base44-entities.backup.json (or vice versa).',
  );
  assert.deepEqual(
    result.additions,
    [],
    'A new entity was added to base44/entities/ without updating config/base44-entities.backup.json.',
  );
});

test('real repo: local base44/entities/ currently matches the approved production manifest', () => {
  const result = runPreflight('production');
  assert.deepEqual(
    result.removals,
    [],
    'An entity was removed from base44/entities/ without updating config/base44-entities.production.json (or vice versa).',
  );
  assert.deepEqual(
    result.additions,
    [],
    'A new entity was added to base44/entities/ without updating config/base44-entities.production.json.',
  );
});
