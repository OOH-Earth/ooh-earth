// Classifies a failed submit so a request that can never succeed (permission,
// validation, conflict, payload too large) is surfaced to the person instead of
// being queued and retried like a network outage.
//
// Same philosophy as withRetry.js: 4xx other than 401/408/429 are deterministic
// client errors; network failures (no status), 401 (session-readiness race),
// 408, 429 and 5xx are transient and stay retryable.
const PERMANENT_STATUSES = new Set([400, 403, 404, 409, 413, 422]);

export class SubmissionRejectedError extends Error {
  /**
   * @param {string} message person-readable explanation
   * @param {{ status?: number, code?: string }} [info]
   */
  constructor(message, info = {}) {
    super(message);
    this.name = 'SubmissionRejectedError';
    this.permanent = true;
    this.status = info.status;
    this.code = info.code;
  }
}

/** @param {any} err */
function statusOf(err) {
  const status = Number(err?.status ?? err?.response?.status);
  return Number.isFinite(status) ? status : undefined;
}

/** @param {any} err */
export function isPermanentSubmitFailure(err) {
  const status = statusOf(err);
  return status !== undefined && PERMANENT_STATUSES.has(status);
}

/** @param {number | undefined} status */
function messageFor(status) {
  if (status === 403)
    return "This report couldn't be accepted — you may not have permission to submit it. Your details are still on this page; try signing in, then submit again.";
  if (status === 409) return 'This report was already submitted from a different account.';
  if (status === 413) return 'A file is too large to upload — try a smaller photo.';
  return 'Some details were rejected — check the form and try again.';
}

// Returns a SubmissionRejectedError for permanent failures, otherwise the
// original error unchanged (so transient failures keep today's queue/retry path).
/** @param {any} err */
export function toSubmitError(err) {
  if (err instanceof SubmissionRejectedError) return err;
  if (!isPermanentSubmitFailure(err)) return err;
  const status = statusOf(err);
  return new SubmissionRejectedError(messageFor(status), {
    status,
    code: err?.data?.code ?? err?.code,
  });
}
