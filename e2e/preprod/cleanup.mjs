#!/usr/bin/env node
// Deletes ONLY BACKUP records that are provably owned by a given preprod
// e2e run -- never Production (this script has no Production app id in it
// at all), and never a record that isn't tagged.
//
// Ownership proof: every record e2e/preprod/*.spec.ts creates carries the
// run's tag (see preprodTag() in fixtures/preprodAuth.ts,
// "[e2e_run_id:<runId>]") in its `notes` field. This script only ever
// matches on that exact string and refuses to run without one.
//
// Usage:
//   PREPROD_ADMIN_TOKEN=... node e2e/preprod/cleanup.mjs --run-id <runId>
//
// Each preprod spec file also does its own afterAll() cleanup already --
// this script exists for the case a run crashed/was killed before its
// afterAll() ran, so BACKUP doesn't slowly accumulate orphaned test data.
// Safe to run repeatedly; matching nothing is not an error.

const BACKUP_BASE_URL = 'https://ooh-earth-backup.base44.app';
const BACKUP_APP_ID = '6a6748e009b947cb29591871';
const PRODUCTION_APP_ID = '6a62213cff3ccbca88c04ff5'; // asserted against, never used
const FORBIDDEN_HOSTS = ['oohearth.app', 'www.oohearth.app', 'ooh.earth', 'oohearth.base44.app'];
const ENTITIES = ['Location', 'LocationPhoto', 'FieldCheck', 'DigitalBust'];

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function assertBackupTarget() {
  const host = new URL(BACKUP_BASE_URL).hostname;
  if (FORBIDDEN_HOSTS.includes(host) || BACKUP_APP_ID === PRODUCTION_APP_ID) {
    console.error('REFUSING TO RUN: target resolves to Production or a Production-like host.');
    process.exit(1);
  }
}

async function main() {
  assertBackupTarget();

  const runId = arg('run-id') || process.env.PREPROD_RUN_ID;
  if (!runId) {
    console.error('Refusing to run: --run-id (or PREPROD_RUN_ID) is required.');
    process.exit(1);
  }
  const tag = `[e2e_run_id:${runId}]`;

  const token = process.env.PREPROD_ADMIN_TOKEN;
  if (!token) {
    console.error('Refusing to run: PREPROD_ADMIN_TOKEN is required.');
    process.exit(1);
  }
  const headers = { Authorization: `Bearer ${token}` };

  let deleted = 0;
  let scanned = 0;

  for (const entity of ENTITIES) {
    // Field-level query support varies by entity; list broadly with the
    // admin token (RLS still applies server-side, but an admin sees
    // everything) and filter client-side on the exact tag string. This is
    // deliberately conservative -- a substring match on notes/title only,
    // never a broad status/date heuristic that could catch a real record.
    const res = await fetch(
      `${BACKUP_BASE_URL}/api/apps/${BACKUP_APP_ID}/entities/${entity}?limit=500`,
      { headers },
    );
    if (!res.ok) {
      console.warn(`Skipping ${entity}: list failed (${res.status})`);
      continue;
    }
    const rows = await res.json();
    scanned += rows.length;
    const owned = rows.filter((row) => typeof row.notes === 'string' && row.notes.includes(tag));
    for (const row of owned) {
      const del = await fetch(
        `${BACKUP_BASE_URL}/api/apps/${BACKUP_APP_ID}/entities/${entity}/${row.id}`,
        { method: 'DELETE', headers },
      );
      if (del.ok) {
        deleted += 1;
        console.log(`Deleted ${entity}/${row.id} (tag-owned by ${runId})`);
      } else {
        console.warn(`Failed to delete ${entity}/${row.id}: ${del.status}`);
      }
    }
  }

  console.log(
    `Scanned ${scanned} records across ${ENTITIES.length} entities, deleted ${deleted} owned by run ${runId}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
