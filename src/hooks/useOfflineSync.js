import { useState, useEffect, useCallback, useRef } from 'react';
import {
  listCaptures,
  removeCapture,
  incrementRetries,
  retryCapture,
  submitQueuedCapture,
} from '@/lib/offlineQueue';

export function useOfflineSync() {
  const [pending, setPending] = useState([]);
  const [syncing, setSyncing] = useState(false);
  // Guards against two flush() calls running over the same queue at once
  // (the 'online' event and the 30s interval can fire back-to-back) --
  // without this, a single real failure could get incrementRetries()
  // called twice for one item, reaching MAX_RETRIES in half the intended
  // number of real attempts.
  const flushingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setPending(await listCaptures());
    } catch {
      setPending([]);
    }
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    // Set synchronously, before the first await -- React reflects this on
    // the very next render, so the badge disables immediately on click
    // rather than after listCaptures() resolves. A caller awaiting the
    // button's disabled/enabled cycle (real users double-tapping, and this
    // fix's own e2e test serializing manual retries) needs that first
    // render to happen before this function's first await point.
    setSyncing(true);
    try {
      const items = await listCaptures();
      // Automatic retries only ever touch pending items -- a 'failed' item
      // stopped being retried automatically the moment it hit MAX_RETRIES;
      // retryCapture() (via retryFailed below) is the only path back.
      const retryable = items.filter((item) => item.status !== 'failed');
      if (!retryable.length) return;

      let changed = false;
      for (const item of retryable) {
        try {
          await submitQueuedCapture(item.payload, item.entityType);
          await removeCapture(item.id);
          changed = true;
        } catch (err) {
          console.warn('Offline sync failed for item', item.id, err?.message);
          try {
            // A genuine IndexedDB write failure here (rare -- quota, a
            // storage-layer error) must not abort the rest of this loop:
            // one item's write failure has nothing to do with whether the
            // NEXT item's own remote submit will succeed.
            await incrementRetries(item.id); // marks 'failed' at MAX_RETRIES, never deletes
          } catch (dbErr) {
            console.warn('Failed to record retry for item', item.id, dbErr?.message);
          }
          changed = true;
        }
      }
      if (changed) await refresh();
    } finally {
      setSyncing(false);
      flushingRef.current = false;
    }
  }, [refresh]);

  // User-initiated: retries every currently-failed item once. Not called
  // automatically (see flush()'s retryable filter above) -- a failed item
  // only syncs again when the user asks it to.
  const retryFailed = useCallback(async () => {
    setSyncing(true);
    try {
      const items = await listCaptures();
      const failed = items.filter((item) => item.status === 'failed');
      if (!failed.length) return;
      for (const item of failed) {
        try {
          await retryCapture(item.id);
        } catch (err) {
          // retryCapture already catches its own remote-submit failure and
          // returns {status:'failed'} for that case -- this only guards the
          // rarer IndexedDB-layer failure, so one item's storage error
          // doesn't stop the rest of a multi-item manual retry.
          console.warn('Manual retry errored for item', item.id, err?.message);
        }
      }
      await refresh();
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('ooh-queue-changed', onChange);
    return () => window.removeEventListener('ooh-queue-changed', onChange);
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => flush();
    window.addEventListener('online', onOnline);
    const timer = setInterval(() => {
      if (navigator.onLine) flush();
    }, 30000);
    return () => {
      window.removeEventListener('online', onOnline);
      clearInterval(timer);
    };
  }, [flush]);

  const pendingOnly = pending.filter((item) => item.status !== 'failed');
  const failedOnly = pending.filter((item) => item.status === 'failed');

  return {
    pending: pendingOnly,
    pendingCount: pendingOnly.length,
    failed: failedOnly,
    failedCount: failedOnly.length,
    syncing,
    flush,
    retryFailed,
    refresh,
  };
}
