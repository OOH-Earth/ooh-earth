import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

// Real-backend fixtures for e2e/preprod/*. Unlike e2e/fixtures/mockBase44.ts,
// nothing here intercepts network traffic — every request in these tests
// hits the actually-deployed BACKUP Base44 app (see docs/TESTING_AND_RELEASE.md
// for why that distinction matters and what each layer does/does not prove).
//
// AUTH STRATEGY: runtime login, not long-lived bearer tokens. Each identity
// is a real BACKUP-only account authenticated at test time through the
// app's own /login form (src/pages/Login.jsx ->
// base44.auth.loginViaEmailPassword) using an email + password pair. The
// resulting session token is read back from localStorage immediately after
// a successful login, held only in memory for the life of the test, and
// never persisted, logged, or printed. This replaced an earlier design that
// stored a long-lived PREPROD_*_TOKEN secret directly -- runtime login
// means a leaked/rotated password is trivially revocable by the account
// owner, and there's no standing bearer credential sitting in GitHub for
// the suite's entire deployment lifetime.
//
// Test identities are never fabricated. Creating a BACKUP account requires
// completing Base44's own email-OTP verification (src/pages/Register.jsx)
// -- an irreducible human step, since nothing in this session can read a
// real inbox. See docs/TESTING_AND_RELEASE.md "Pre-production test
// identities" for exactly what a human needs to do once, and how these
// email/password pairs get into GitHub Environment secrets after that (the
// human sets them directly; this repo's tooling never sees or prints a
// password).

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

// Email is a namespaced identifier, not a secret -- safe to keep as a plain
// constant. Only the password is credential material, read from the
// environment (a GitHub Environment secret in CI; a local .env for a human
// operator running this suite by hand -- never committed).
const EMAIL_BY_IDENTITY: Record<PreprodIdentity, string> = {
  creator: 'runner@ooh.earth',
  otherUser: 'casper@advertisersanonymous.org',
  admin: 'gonzo@ooh.earth',
};

const PASSWORD_ENV_VAR_BY_IDENTITY: Record<PreprodIdentity, string> = {
  creator: 'PREPROD_CREATOR_PASSWORD',
  otherUser: 'PREPROD_OTHER_USER_PASSWORD',
  admin: 'PREPROD_ADMIN_PASSWORD',
};

export function preprodEmail(identity: PreprodIdentity): string {
  return EMAIL_BY_IDENTITY[identity];
}

function preprodPassword(identity: PreprodIdentity): string | undefined {
  return process.env[PASSWORD_ENV_VAR_BY_IDENTITY[identity]];
}

export function requirePreprodCredentials(...identities: PreprodIdentity[]): string | null {
  const missing = identities.filter((identity) => !preprodPassword(identity));
  if (!missing.length) return null;
  const vars = missing.map((identity) => PASSWORD_ENV_VAR_BY_IDENTITY[identity]).join(', ');
  return `Missing preprod credentials: ${vars}. See docs/TESTING_AND_RELEASE.md "Pre-production test identities" for setup.`;
}

// One real login per (page, identity) -- cached per test's own Page object,
// never written to disk. A second call for the same identity on the same
// page reuses the session already established in that browser context
// rather than logging in again.
const sessionTokenCache = new WeakMap<Page, Map<PreprodIdentity, string>>();

/**
 * Performs a real login through the app's own /login form
 * (base44.auth.loginViaEmailPassword — no OTP required for login, only for
 * initial registration) and returns the resulting session token, read back
 * from localStorage immediately after Base44 issues it. Held in memory
 * only; never logged.
 */
export async function loginAsIdentity(page: Page, identity: PreprodIdentity): Promise<string> {
  let cache = sessionTokenCache.get(page);
  if (!cache) {
    cache = new Map();
    sessionTokenCache.set(page, cache);
  }
  const cached = cache.get(identity);
  if (cached) return cached;

  const password = preprodPassword(identity);
  if (!password) {
    throw new Error(
      `No password available for preprod identity "${identity}" (expected env var ${PASSWORD_ENV_VAR_BY_IDENTITY[identity]}). Call requirePreprodCredentials() and test.skip() first.`,
    );
  }

  await page.goto(new URL('/login', PREPROD_BACKUP_BASE_URL).toString());
  await page.getByLabel('Email', { exact: true }).fill(EMAIL_BY_IDENTITY[identity]);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /^Log in$/ }).click();
  // Login.jsx does a hard `window.location.href = returnTo` on success (not
  // a client-side route change) -- wait for that navigation away from
  // /login, then confirm a token actually landed in storage rather than
  // trusting the URL change alone.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
  const token = await page.evaluate(() => window.localStorage.getItem('base44_access_token'));
  if (!token) {
    throw new Error(
      `Login for preprod identity "${identity}" appeared to succeed (left /login) but no session token was found in localStorage afterward.`,
    );
  }
  cache.set(identity, token);
  return token;
}

/**
 * Navigates to a BACKUP path as the given identity, logging in for real
 * first if this page hasn't already authenticated as that identity.
 * `identity: null` navigates unauthenticated (the anonymous case) --
 * clears any prior session on this page first, so a test can go from an
 * authenticated identity to genuinely anonymous within the same test.
 */
export async function gotoAsIdentity(
  page: Page,
  path: string,
  identity: PreprodIdentity | null,
): Promise<void> {
  if (identity) {
    await loginAsIdentity(page, identity);
  } else {
    await page.goto(PREPROD_BACKUP_BASE_URL);
    await page.evaluate(() => window.localStorage.clear());
  }
  await page.goto(new URL(path, PREPROD_BACKUP_BASE_URL).toString());
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
