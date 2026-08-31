import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Structural regression guard for a real privilege-escalation gap found in a
// security audit: User.jsonc was the ONLY entity in this repo with no `rls`
// block at all, and this app's own client code (src/pages/Account.jsx)
// relied entirely on CLIENT-SIDE omission of role/access/agency from its
// `base44.auth.updateMe()` call as the only defense -- trivially bypassable
// by any caller hitting `PUT /entities/User/me` directly (confirmed via
// @base44/sdk's auth.js: updateMe() is a raw, unfiltered passthrough of
// whatever object is passed to it).
//
// Base44 supports per-field `rls.write` restrictions (confirmed via
// https://docs.base44.com/developers/backend/resources/entities/security.md)
// independent of whatever record-level `update` rule applies -- this is the
// actual fix, applied to User.jsonc. This test cannot verify live Base44
// enforcement (no backend exists in this sandbox and this repo has no local
// Base44 emulator); it only guards against this exact protection silently
// regressing in a future edit to User.jsonc.

const USER_ENTITY_PATH = fileURLToPath(new URL('./User.jsonc', import.meta.url));
const PRIVILEGE_FIELDS = ['role', 'access', 'agency'];

function loadUserEntity() {
  return JSON.parse(readFileSync(USER_ENTITY_PATH, 'utf8'));
}

test('User.jsonc is valid JSON', () => {
  assert.doesNotThrow(loadUserEntity);
});

for (const field of PRIVILEGE_FIELDS) {
  test(`User.${field} restricts writes to admins via field-level RLS`, () => {
    const entity = loadUserEntity();
    const prop = entity.properties?.[field];
    assert.ok(prop, `User.jsonc must declare a "${field}" property`);
    assert.deepEqual(
      prop.rls?.write,
      { user_condition: { role: 'admin' } },
      `User.${field} must restrict rls.write to admins -- without this, any authenticated ` +
        `user can self-escalate by calling base44.auth.updateMe({ ${field}: 'admin' }) directly, ` +
        `bypassing this app's own UI entirely.`,
    );
  });
}
