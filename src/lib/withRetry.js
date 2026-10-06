// @ts-nocheck
// Bounded retry primitive shared with Base44 location loading. Keep provider
// policy in the caller; this module only performs the bounded retry and
// respects Retry-After when the error exposes it.
function retryAfterMs(err) {
  const header = err?.originalError?.response?.headers?.['retry-after'];
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(header);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : null;
}

export async function withRetry(fn, { retries = 1, delayMs = 400, shouldRetry = () => true } = {}) {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0 || !shouldRetry(err)) throw err;
    await new Promise((resolve) => setTimeout(resolve, retryAfterMs(err) ?? delayMs));
    return withRetry(fn, { retries: retries - 1, delayMs, shouldRetry });
  }
}
