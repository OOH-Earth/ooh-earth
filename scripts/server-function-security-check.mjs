import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (name, file = 'entry.ts') =>
  fs.readFileSync(`base44/functions/${name}/${file}`, 'utf8');
const migration = read('migrateLocationImages', 'handler.ts');
const n8n = read('n8nPing', 'handler.ts');
const scan = read('scanAd', 'handler.ts');
const migrationEntry = read('migrateLocationImages');
const n8nEntry = read('n8nPing');
const scanEntry = read('scanAd');
const cachedIntel = read('cachedIntel', 'handler.ts');
const donation = read('createDonationCheckout', 'handler.ts');
const claim = read('claimLead', 'handler.ts');
const stripe = read('stripeWebhook', 'handler.ts');

// These dependency-free checks complement the behavioral Deno harness. They
// guard the source-level boundaries even when the Base44 runtime is unavailable.
assert.match(migration, /auth\.me\(\)/, 'migration must resolve the caller');
assert.match(migration, /role[^=]*===\s*['"]admin['"]/, 'migration must require a platform admin');
assert.match(migration, /POST only/, 'migration must reject non-POST requests');
assert.doesNotMatch(migration, /stack\s*:/, 'migration must not return stack traces');
assert.match(
  migrationEntry,
  /handleMigrateLocationImages/,
  'migration entry must delegate to handler',
);

assert.match(n8n, /auth\.me\(\)/, 'n8n ping must resolve the caller');
assert.match(n8n, /role[^=]*===\s*['"]admin['"]/, 'n8n ping must require a platform admin');
assert.match(n8n, /AbortController/, 'n8n ping must have a timeout mechanism');
assert.match(n8n, /NOTE_MAX/, 'n8n ping must bound custom input');
assert.doesNotMatch(n8n, /body\s*\}\s*[,}]/, 'n8n ping must not reflect downstream body data');
assert.match(n8n, /Webhook unavailable/, 'n8n ping must sanitize downstream errors');
assert.match(n8nEntry, /handleN8nPing/, 'n8n entry must delegate to handler');

assert.match(scan, /auth\.me\(\)/, 'scanAd must require an authenticated caller');
assert.match(scan, /MAX_FILE_URL_LENGTH/, 'scanAd must bound URL input length');
assert.match(
  scan,
  /MEDIA_HOST\s*=\s*['"]media\.base44\.com['"]/,
  'scanAd must use a media host allowlist',
);
assert.match(scan, /url\.protocol\s*===\s*['"]https:['"]/, 'scanAd must require HTTPS');
assert.match(scan, /Scan unavailable/, 'scanAd must sanitize provider errors');
assert.match(scanEntry, /handleScanAd/, 'scanAd entry must delegate to handler');

assert.match(cachedIntel, /POST only/, 'cachedIntel must reject non-POST requests');
assert.match(cachedIntel, /inFlight/, 'cachedIntel must coalesce concurrent cache misses');
assert.match(cachedIntel, /Intel unavailable/, 'cachedIntel must sanitize provider errors');

assert.match(donation, /POST only/, 'donation checkout must reject non-POST requests');
assert.match(donation, /Number\.isFinite/, 'donation checkout must reject non-finite amounts');
assert.match(donation, /MAX_DONATION_USD/, 'donation checkout must bound amounts');
assert.match(donation, /Idempotency-Key/, 'donation checkout must forward Stripe idempotency');
assert.match(claim, /POST only/, 'claimLead must reject non-POST requests');
assert.match(claim, /HANDLE_MAX/, 'claimLead must bound handles');
assert.match(claim, /inFlight/, 'claimLead must guard local concurrent claims');
assert.match(stripe, /verifyStripeSignature/, 'stripeWebhook must verify signatures');
assert.match(stripe, /FundingLead/, 'stripeWebhook must persist funding records');
assert.match(stripe, /Purchase/, 'stripeWebhook must dedupe purchases');
assert.match(stripe, /Webhook processing unavailable/, 'stripeWebhook must sanitize failures');

console.log('server-function security boundary checks: passed');
