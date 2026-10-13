// Same-browser mutual exclusion for sending one queued report.
//
// This is NOT backend idempotency. It only stops two tabs/windows of the same
// browser from sending the same operation at the same moment (the queue lives in
// shared IndexedDB, so every open tab would otherwise try to flush the same item).
// It does nothing across devices, after a lock holder dies mid-request, or for a
// slow server request that outlives its tab. The server-side check and its
// documented race window remain the only protection there.
export class OperationBusyError extends Error {
  constructor() {
    super('Another tab is already sending this report.');
    this.name = 'OperationBusyError';
    this.busy = true;
  }
}

/**
 * @template T
 * @param {string | undefined} operationId
 * @param {() => Promise<T>} fn
 * @param {{ waitIfBusy?: boolean }} [options] waitIfBusy: queue behind the holder;
 *   otherwise throw OperationBusyError immediately (a skipped cycle, not a failure).
 * @returns {Promise<T>}
 */
export async function withOperationLock(operationId, fn, options = {}) {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!operationId || !locks || typeof locks.request !== 'function') return fn(); // unsupported: no protection
  const name = `ooh-submit:${operationId}`;
  const lockOptions = options.waitIfBusy ? {} : { ifAvailable: true };
  return locks.request(name, lockOptions, async (lock) => {
    if (!lock) throw new OperationBusyError();
    return fn();
  });
}
