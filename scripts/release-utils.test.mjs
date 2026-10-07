import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assertBuildArtifact,
  redactCliOutput,
  writeReleaseManifestArtifact,
} from './release-utils.mjs';

test('redacts bearer tokens, JWTs, and secret-like values', () => {
  const raw = 'Authorization: Bearer abc.def.ghi token=hidden api_key:secret';
  const safe = redactCliOutput(raw);
  assert.doesNotMatch(safe, /abc\.def\.ghi|hidden|secret/);
  assert.match(safe, /REDACTED/);
});

test('build preflight fails closed before deployment', () => {
  assert.throws(() => assertBuildArtifact(false), /Build artifact missing/);
  assert.doesNotThrow(() => assertBuildArtifact(true));
});

test('published manifest is written to the deployed dist artifact', () => {
  const directory = mkdtempSync(join(tmpdir(), 'ooh-release-'));
  const path = join(directory, 'release-manifest.json');
  writeReleaseManifestArtifact(path, {
    schema: 'ooh-earth.release-manifest.v3',
    release_state: 'CERTIFIED',
  });
  assert.equal(JSON.parse(readFileSync(path, 'utf8')).release_state, 'CERTIFIED');
});
