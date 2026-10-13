// Plain Node test. Run with: node src/lib/queueIdentity.test.mjs
import assert from 'node:assert/strict';

// queueIdentity.js touches window/localStorage only inside functions that are not
// exercised here; provide minimal stand-ins so the module imports cleanly.
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent = class {};
globalThis.localStorage = { getItem: () => null, setItem() {} };
const { classifyQueueItem, ANONYMOUS } = await import('./queueIdentity.js');

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
if (failed) process.exitCode = 1;
