import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Structural regression guard for a real, CONFIRMED moderation-bypass
// vulnerability: Location, FieldCheck, DigitalBust, and LocationPhoto all
// have `rls.create: null` (open by design -- anyone can submit a report)
// and a `status` enum field (pending/verified/rejected) with NO field-level
// write restriction. Runtime-verified against BACKUP (2026-08-31): a
// completely unauthenticated POST to the raw entity endpoint with
// `status: "verified"` was accepted and persisted with `created_by_id:
// "anonymous"` -- a fabricated report could self-verify, bypassing
// moderate.ts's queue entirely. Location's `status_updated_at` carries the
// same risk (lets a forged submission also fake *when* it was "confirmed").
//
// The fix locks `status`/`status_updated_at` writes to the same
// admin/moderator (+ agency, where the entity's own record-level `update`
// RLS already grants it) authorization moderate.ts itself uses -- this
// test only proves the schema declaration didn't regress; it cannot
// exercise live Base44 RLS enforcement from this repo (no local emulator
// exists). See base44/functions/tests/security.test.ts's
// "submitOffline strips a forged status..." test for the complementary
// function-level guard.

const ENTITIES_DIR = fileURLToPath(new URL('.', import.meta.url));

function loadEntity(name) {
  return JSON.parse(readFileSync(`${ENTITIES_DIR}${name}.jsonc`, 'utf8'));
}

const MODERATOR_CONDITION = {
  $or: [
    { user_condition: { role: 'admin' } },
    { user_condition: { 'data.access': 'admin' } },
    { user_condition: { 'data.access': 'moderator' } },
  ],
};

const MODERATOR_OR_AGENCY_CONDITION = {
  $or: [
    { user_condition: { role: 'admin' } },
    { user_condition: { 'data.access': 'admin' } },
    { user_condition: { 'data.access': 'moderator' } },
    { user_condition: { 'data.agency': true } },
  ],
};

// entity name -> [ [field, expected condition], ... ]
// Location and FieldCheck's own record-level `update` RLS already grants
// agency users a path to touch the record (LocationEditPanel.jsx's
// canEditLocation() relies on exactly this) -- the field-level rule for
// `status` must match that, or it becomes the more restrictive layer and
// breaks that legitimate, already-shipped editing flow. DigitalBust and
// LocationPhoto have no such agency-reachable editor, so they stay
// admin/moderator-only, matching their own narrower record-level `update`.
const CASES = [
  [
    'Location',
    [
      ['status', MODERATOR_OR_AGENCY_CONDITION],
      ['status_updated_at', MODERATOR_OR_AGENCY_CONDITION],
    ],
  ],
  ['FieldCheck', [['status', MODERATOR_OR_AGENCY_CONDITION]]],
  ['DigitalBust', [['status', MODERATOR_CONDITION]]],
  ['LocationPhoto', [['status', MODERATOR_CONDITION]]],
];

for (const [entityName, fields] of CASES) {
  for (const [field, expected] of fields) {
    test(`${entityName}.${field} restricts writes to moderators via field-level RLS`, () => {
      const entity = loadEntity(entityName);
      const prop = entity.properties?.[field];
      assert.ok(prop, `${entityName}.jsonc must declare a "${field}" property`);
      assert.deepEqual(
        prop.rls?.write,
        expected,
        `${entityName}.${field} must restrict rls.write -- without this, an unauthenticated ` +
          `POST to the raw entity endpoint can set ${field} directly, bypassing moderate.ts entirely. ` +
          `Confirmed exploitable against BACKUP before this fix (2026-08-31).`,
      );
    });
  }
}

test('Location and FieldCheck retain create: null (open submission stays intact)', () => {
  for (const name of ['Location', 'FieldCheck', 'DigitalBust', 'LocationPhoto']) {
    const entity = loadEntity(name);
    assert.equal(
      entity.rls?.create,
      null,
      `${name}.jsonc's create RLS must stay open (null) -- this fix protects the status ` +
        `field specifically, not the ability to submit a report at all.`,
    );
  }
});
