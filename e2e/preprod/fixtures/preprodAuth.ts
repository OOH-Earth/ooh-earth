import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

// Real-backend fixtures for e2e/preprod/*. Unlike e2e/fixtures/mockBase44.ts,
// nothing here intercepts network traffic — every request in these tests
// hits the actually-deployed BACKUP Base44 app (see docs/TESTING_AND_RELEASE.md
// for why that distinction matters and what each layer does/does not prove).
//
// Test identities are never fabricated here. Each token below must be a
// real, already-authenticated Base44 session token for a BACKUP-only test
// account, supplied via GitHub Environment secrets (see
// docs/TESTING_AND_RELEASE.md "Pre-production test identities" for exactly
// what to create and how to obtain each token). If a required token is
// missing -- e.g. running locally without the env vars set, or before the
// secrets have been provisioned -- the affected tests call test.skip() with
// an explanation instead of failing or fabricating a session, and instead
// of silently reporting a false pass.

export const PREPROD_BACKUP_APP_ID = '6a6748e009b947cb29591871';
const PREPROD_BACKUP_BASE_URL_RAW = 'https://ooh-earth-backup.base44.app';

// PRODUCTION_APP_ID is the real production Base44 app
// (base44/entities/*.jsonc's own docs cite it, and it's the id used by
// scripts/release.mjs / release-certification.mjs for the production
// target). Listed here ONLY to assert against, never to talk to.
const PRODUCTION_APP_ID = '6a62213cff3ccbca88c04ff5';
const FORBIDDEN_HOSTS = ['oohearth.app', 'www.oohearth.app', 'ooh.earth', 'oohearth.base44.app'];

// Hard, synchronous, import-time guard: this whole real-backend suite exists
// specifically to write test data and (in cleanup.mjs) delete records. If a
// future edit ever pointed PREPROD_BACKUP_APP_ID/BASE_URL at Production --
// by mistake, by a bad merge, by copy-paste -- that would be a destructive-
// data incident, not a test failure to shrug off. Fail before a single
// request is made, not after.
function assertNotProduction(baseUrl: string, appId: string): void {
  const host = new URL(baseUrl).hostname;
  if (FORBIDDEN_HOSTS.includes(host)) {
    throw new Error(
      `REFUSING TO RUN: preprod base URL resolves to a forbidden (Production-or-production-like) host "${host}". This suite must only ever target BACKUP.`,
    );
  }
  if (appId === PRODUCTION_APP_ID) {
    throw new Error(
      `REFUSING TO RUN: preprod app id equals the real Production app id (${PRODUCTION_APP_ID}). This suite must only ever target BACKUP.`,
    );
  }
  if (appId !== '6a6748e009b947cb29591871') {
    throw new Error(
      `REFUSING TO RUN: preprod app id "${appId}" does not match the known BACKUP app id. Refusing to guess.`,
    );
  }
}
assertNotProduction(PREPROD_BACKUP_BASE_URL_RAW, PREPROD_BACKUP_APP_ID);

export const PREPROD_BACKUP_BASE_URL = PREPROD_BACKUP_BASE_URL_RAW;

export type PreprodIdentity = 'creator' | 'otherUser' | 'admin';

const ENV_VAR_BY_IDENTITY: Record<PreprodIdentity, string> = {
  creator: 'PREPROD_CREATOR_TOKEN',
  otherUser: 'PREPROD_OTHER_USER_TOKEN',
  admin: 'PREPROD_ADMIN_TOKEN',
};

export function preprodToken(identity: PreprodIdentity): string | undefined {
  return process.env[ENV_VAR_BY_IDENTITY[identity]];
}

export function requirePreprodTokens(...identities: PreprodIdentity[]): string | null {
  const missing = identities.filter((identity) => !preprodToken(identity));
  if (!missing.length) return null;
  const vars = missing.map((identity) => ENV_VAR_BY_IDENTITY[identity]).join(', ');
  return `Missing preprod credentials: ${vars}. See docs/TESTING_AND_RELEASE.md "Pre-production test identities" for setup.`;
}

/**
 * Navigates to a BACKUP path authenticated as the given identity by
 * appending Base44's own ?access_token= URL param (see src/lib/app-params.js
 * -- the app reads and persists it to localStorage, then strips it from the
 * URL on the very first load). `identity: null` navigates unauthenticated
 * (the anonymous case).
 */
export async function gotoAsIdentity(
  page: Page,
  path: string,
  identity: PreprodIdentity | null,
): Promise<void> {
  const token = identity ? preprodToken(identity) : null;
  const url = new URL(path, PREPROD_BACKUP_BASE_URL);
  if (token) url.searchParams.set('access_token', token);
  await page.goto(url.toString());
}

// A unique tag stamped into every record these tests create, so cleanup can
// prove ownership before deleting anything (see e2e/preprod/cleanup.mjs).
// Never delete a BACKUP record that doesn't carry this exact run's tag.
export function preprodRunId(): string {
  return (
    process.env.PREPROD_RUN_ID || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
}

export function preprodTag(runId: string): string {
  return `[e2e_run_id:${runId}]`;
}

export const test = base.extend<{ preprodRunTag: string }>({
  preprodRunTag: async ({}, use) => {
    await use(preprodTag(preprodRunId()));
  },
});

export { expect } from '@playwright/test';
