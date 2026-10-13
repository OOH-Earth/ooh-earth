// Plain Node test. Run with: node src/lib/operationLock.test.mjs
import assert from 'node:assert/strict';

// Minimal Web Locks stand-in: exclusive per name; ifAvailable returns null when held.
function makeLocks() {
  const held = new Set();
  const waiters = new Map();
  return {
    async request(name, options, callback) {
      if (held.has(name)) {
        if (options.ifAvailable) return callback(null);
        await new Promise((resolve) => waiters.set(name, [...(waiters.get(name) || []), resolve]));
      }
      held.add(name);
      try {
        return await callback({ name });
      } finally {
        held.delete(name);
        const next = (waiters.get(name) || []).shift();
        if (next) next();
      }
    },
  };
}

let failed = false;
async function t(name, fn) {
  try {
    await fn();
    console.log('ok -', name);
  } catch (e) {
    failed = true;
    console.error('FAIL -', name, '\n ', e.message);
  }
}

const setNavigator = (value) =>
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
setNavigator({ locks: makeLocks() });
const { withOperationLock, OperationBusyError } = await import('./operationLock.js');

await t('a second sender for the same operation is told it is busy, not failed', async () => {
  let release;
  const first = withOperationLock('op-1', () => new Promise((r) => (release = r)));
  await new Promise((r) => setTimeout(r, 5));
  await assert.rejects(
    () => withOperationLock('op-1', async () => 'x'),
    (e) => e instanceof OperationBusyError && e.busy === true,
  );
  release('done');
  assert.equal(await first, 'done');
});
await t('different operations do not block each other', async () => {
  let release;
  const a = withOperationLock('op-a', () => new Promise((r) => (release = r)));
  assert.equal(await withOperationLock('op-b', async () => 'b'), 'b');
  release('a');
  await a;
});
await t('waitIfBusy queues behind the holder instead of failing', async () => {
  const order = [];
  let release;
  const first = withOperationLock(
    'op-2',
    () =>
      new Promise(
        (r) =>
          (release = () => {
            order.push('first');
            r();
          }),
      ),
  );
  await new Promise((r) => setTimeout(r, 5));
  const second = withOperationLock('op-2', async () => order.push('second'), { waitIfBusy: true });
  release();
  await first;
  await second;
  assert.deepEqual(order, ['first', 'second']);
});
await t('the lock is released after an error', async () => {
  await assert.rejects(
    () =>
      withOperationLock('op-3', async () => {
        throw new Error('boom');
      }),
    /boom/,
  );
  assert.equal(await withOperationLock('op-3', async () => 'again'), 'again');
});
await t(
  'without Web Locks or an operation id the work still runs (no protection claimed)',
  async () => {
    const saved = globalThis.navigator;
    setNavigator({});
    assert.equal(await withOperationLock('op-4', async () => 'ran'), 'ran');
    setNavigator(saved);
    assert.equal(await withOperationLock(undefined, async () => 'ran2'), 'ran2');
  },
);
if (failed) process.exitCode = 1;
