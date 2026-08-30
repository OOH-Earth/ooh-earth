import test from 'node:test';
import assert from 'node:assert/strict';
import { assertBuildArtifact, redactCliOutput } from './release-utils.mjs';

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
