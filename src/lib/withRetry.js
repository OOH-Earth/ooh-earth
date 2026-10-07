// Retries an async function a bounded number of times, but only for
// failures that look transient. Extracted as its own module so it can be
// unit tested without a real Base44 SDK client or network access -- see
// withRetry.test.mjs and the usage/rationale comment in
// src/api/base44Client.js (fixes intermittent Location-loading failures
// caused by a session-readiness race on first load).
//
// Default retry policy: retry when the thrown error has no `.status` at all
// (a network-level failure -- offline, timeout, DNS, CORS preflight
// rejection) or when `.status` is one of 401, 408, 429, 502, 503, 504.
// 401 is retried deliberately here even though it's unusual to retry an
// "unauthorized" response in general -- the diagnosed root cause is a
// session-readiness race where the identical request succeeds moments
// later with no change in credentials, not a genuine authorization
// failure. Every other 4xx (400 bad request, 403 forbidden, 404 not
// found, 422 validation, etc.) is a deterministic client error that a
// second identical attempt cannot fix, so it is never retried.
const DEFAULT_RETRYABLE_STATUSES = new Set([401, 408, 429, 502, 503, 504]);

function isRetryable(err) {
  const status = err?.status;
  if (status === undefined || status === null) return true; // network-level failure
  return DEFAULT_RETRYABLE_STATUSES.has(status);
}

// A 429's Retry-After header (seconds or an HTTP date), when present, wins
// over the configured delay -- this is what "respect rate-limit semantics"
// means in practice for a single bounded retry.
function retryAfterMs(err) {
  const header = err?.originalError?.response?.headers?.['retry-after'];
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(header);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : null;
}

export async function withRetry(
  fn,
  { retries = 1, delayMs = 400, shouldRetry = isRetryable } = {},
) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0 || !shouldRetry(err)) throw err;
    const wait = retryAfterMs(err) ?? delayMs;
    await new Promise((resolve) => setTimeout(resolve, wait));
    return withRetry(fn, { retries: retries - 1, delayMs, shouldRetry });
  }
}
