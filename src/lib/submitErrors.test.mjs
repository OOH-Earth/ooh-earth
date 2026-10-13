// Plain Node test. Run with: node src/lib/submitErrors.test.mjs
import assert from 'node:assert/strict';
import {
  SubmissionRejectedError,
  isPermanentSubmitFailure,
  toSubmitError,
} from './submitErrors.js';

const err = (status, extra = {}) =>
  Object.assign(new Error(`status ${status}`), { status, ...extra });
let failed = false;
function t(name, fn) {
  try {
    fn();
    console.log('ok -', name);
  } catch (e) {
    failed = true;
    console.error('FAIL -', name, '\n ', e.message);
  }
}

t('permission, validation, conflict and size failures are permanent', () => {
  for (const s of [400, 403, 404, 409, 413, 422])
    assert.equal(isPermanentSubmitFailure(err(s)), true, String(s));
});
t('network failures, 401 session races, 408, 429 and 5xx stay transient', () => {
  for (const s of [401, 408, 429, 500, 502, 503, 504])
    assert.equal(isPermanentSubmitFailure(err(s)), false, String(s));
  assert.equal(isPermanentSubmitFailure(new Error('Network Error')), false);
  assert.equal(isPermanentSubmitFailure(undefined), false);
});
t('axios-style response.status is understood', () => {
  assert.equal(isPermanentSubmitFailure({ response: { status: 403 } }), true);
});
t('permanent errors become SubmissionRejectedError with a person-readable message', () => {
  const out = toSubmitError(err(403, { data: { code: 'FORBIDDEN' } }));
  assert.ok(out instanceof SubmissionRejectedError);
  assert.equal(out.permanent, true);
  assert.equal(out.status, 403);
  assert.equal(out.code, 'FORBIDDEN');
  assert.match(out.message, /permission/i);
  assert.match(toSubmitError(err(422)).message, /rejected/i);
  assert.match(toSubmitError(err(413)).message, /too large/i);
});
t('transient errors pass through untouched so they keep the queue/retry path', () => {
  const original = err(503);
  assert.equal(toSubmitError(original), original);
});
t('already-classified errors are not wrapped twice', () => {
  const once = toSubmitError(err(403));
  assert.equal(toSubmitError(once), once);
});
t('a validation error names the rejected parts without echoing values', () => {
  const out = toSubmitError(
    err(422, {
      data: {
        code: 'VALIDATION',
        fields: [
          { field: 'lat', reason: 'out_of_range' },
          { field: 'lng', reason: 'out_of_range' },
          { field: 'image_url', reason: 'invalid_url' },
        ],
      },
    }),
  );
  assert.match(out.message, /Some details were rejected \(location, photo\)/);
  assert.equal(out.permanent, true);
});
t('a validation error with unknown fields still gets a generic permanent message', () => {
  assert.match(
    toSubmitError(err(422, { data: { fields: [{ field: 'weird' }] } })).message,
    /\(a field\)/,
  );
  assert.match(toSubmitError(err(422)).message, /Some details were rejected — /);
});
if (failed) process.exitCode = 1;
