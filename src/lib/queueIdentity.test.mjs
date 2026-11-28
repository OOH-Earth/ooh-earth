// Plain Node test. Run with: node src/lib/queueIdentity.test.mjs
import assert from 'node:assert/strict';

// queueIdentity.js touches window/localStorage only inside functions that are not
// exercised here; provide minimal stand-ins so the module imports cleanly.
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent = class {};
globalThis.localStorage = { getItem: () => null, setItem() {} };
const { classifyQueueItem, ANONYMOUS, canSendNow, setQueueIdentity, IdentityChangedError } =
  await import('./queueIdentity.js');

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
const id = (value, confirmed = true) => ({ id: value, confirmed });

t('an unconfirmed identity sends nothing', () => {
  assert.equal(classifyQueueItem({ owner: 'u1' }, id('u1', false)), 'unresolved');
  assert.equal(classifyQueueItem({ owner: 'u1' }, { id: null, confirmed: false }), 'unresolved');
});
t('items owned by the current identity are sent automatically', () => {
  assert.equal(classifyQueueItem({ owner: 'u1' }, id('u1')), 'own');
  assert.equal(classifyQueueItem({ owner: ANONYMOUS }, id(ANONYMOUS)), 'own');
});
t('anonymous -> signed-in: the draft is held and needs an explicit choice', () => {
  assert.equal(classifyQueueItem({ owner: ANONYMOUS }, id('u1')), 'adoptable');
});
t("account switch: another member's draft is never sendable", () => {
  assert.equal(classifyQueueItem({ owner: 'userA' }, id('userB')), 'foreign');
});
t("logout: a member's draft is held, not sent anonymously", () => {
  assert.equal(classifyQueueItem({ owner: 'u1' }, id(ANONYMOUS)), 'foreign');
});
t('legacy items (no owner) are held for explicit choice in either state', () => {
  assert.equal(classifyQueueItem({}, id('u1')), 'adoptable');
  assert.equal(classifyQueueItem({ owner: null }, id(ANONYMOUS)), 'adoptable');
});
t('canSendNow re-checks the live identity: a mid-sync switch or sign-out blocks the send', () => {
  const item = { owner: 'u1' };
  setQueueIdentity('u1');
  assert.equal(canSendNow(item, 'u1'), true);
  setQueueIdentity('u2'); // account switch during the sync
  assert.equal(canSendNow(item, 'u1'), false);
  setQueueIdentity('u1');
  setQueueIdentity(null); // sign-out during the sync
  assert.equal(canSendNow(item, 'u1'), false);
  setQueueIdentity('u1', { confirmed: false }); // identity no longer confirmed
  assert.equal(canSendNow(item, 'u1'), false);
});
t(
  'a draft owned by someone else is never sendable even if the expected id matches the session',
  () => {
    setQueueIdentity('u1');
    assert.equal(canSendNow({ owner: 'u2' }, 'u1'), false);
    assert.equal(canSendNow({ owner: 'anonymous' }, 'u1'), false);
    assert.equal(canSendNow({}, 'u1'), false);
  },
);
t('IdentityChangedError is distinguishable from a delivery failure', () => {
  const e = new IdentityChangedError();
  assert.equal(e.identityChanged, true);
  assert.equal(e.permanent, undefined);
});
if (failed) process.exitCode = 1;
