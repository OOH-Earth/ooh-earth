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

export const PREPROD_BACKUP_BASE_URL = 'https://ooh-earth-backup.base44.app';
export const PREPROD_BACKUP_APP_ID = '6a6748e009b947cb29591871';

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
