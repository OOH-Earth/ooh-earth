import { useState, useEffect, useCallback, useRef } from 'react';
import {
  listCaptures,
  removeCapture,
  incrementRetries,
  markFailed,
  adoptCapture,
  retryCapture,
  submitQueuedCapture,
} from '@/lib/offlineQueue';
import { canSendNow, classifyQueueItem, getQueueIdentity } from '@/lib/queueIdentity';

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
      // Only items saved by the identity that is signed in right now are sent
      // automatically; anything else is held (never discarded, never reassigned).
      const identity = getQueueIdentity();
      const retryable = items.filter(
        (item) => item.status !== 'failed' && classifyQueueItem(item, identity) === 'own',
      );
      if (!retryable.length) return;

      let changed = false;
      for (const item of retryable) {
        // Re-check the identity immediately before each send: a sign-out or
        // account switch during this sync must stop it, not redirect it.
        if (!canSendNow(item, identity.id)) break;
        try {
          await submitQueuedCapture(item.payload, item.entityType, {
            item,
            expectedOwner: identity.id,
          });
          await removeCapture(item.id);
          changed = true;
        } catch (err) {
          // Not a delivery failure: the identity changed, so leave the draft untouched.
          if (err?.identityChanged) break;
          console.warn('Offline sync failed for item', item.id, err?.message);
          try {
            // A genuine IndexedDB write failure here (rare -- quota, a
            // storage-layer error) must not abort the rest of this loop:
            // one item's write failure has nothing to do with whether the
            // NEXT item's own remote submit will succeed.
            // A permanent rejection (permission/validation) cannot succeed on
            // retry: fail it immediately rather than repeating it MAX_RETRIES times.
            if (err?.permanent) await markFailed(item.id, err.status);
            else await incrementRetries(item.id); // marks 'failed' at MAX_RETRIES, never deletes
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
      const identity = getQueueIdentity();
      const failed = items.filter(
        (item) => item.status === 'failed' && classifyQueueItem(item, identity) === 'own',
      );
      if (!failed.length) return;
      for (const item of failed) {
        try {
          await retryCapture(item.id, identity.id);
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

  const [identity, setIdentity] = useState(getQueueIdentity());

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    const onIdentity = () => {
      setIdentity({ ...getQueueIdentity() });
      refresh();
    };
    window.addEventListener('ooh-queue-changed', onChange);
    window.addEventListener('ooh-queue-identity-changed', onIdentity);
    return () => {
      window.removeEventListener('ooh-queue-changed', onChange);
      window.removeEventListener('ooh-queue-identity-changed', onIdentity);
    };
  }, [refresh]);

  // When the confirmed identity changes (sign-in, sign-out, account switch), send
  // whatever belongs to the new identity.
  useEffect(() => {
    if (identity.confirmed && navigator.onLine) flush();
  }, [identity.id, identity.confirmed, flush]);

  // Explicit, per-report choice: send ONE held draft under the current identity
  // (an anonymous or legacy draft -> the account signed in now, or anonymously).
  // Never bulk, never automatic. Re-checks the draft is still adoptable and that
  // the identity is still confirmed at the moment of the tap, so a repeated tap
  // (the draft is already its own by then) or a mid-air sign-out does nothing.
  const adoptingRef = useRef(new Set());
  const adoptOne = useCallback(
    async (id) => {
      if (adoptingRef.current.has(id)) return;
      adoptingRef.current.add(id);
      try {
        const current = getQueueIdentity();
        if (!current.confirmed) return;
        const item = (await listCaptures()).find((i) => i.id === id);
        if (!item || classifyQueueItem(item, current) !== 'adoptable') return;
        await adoptCapture(id, current.id);
        await refresh();
        await flush();
      } finally {
        adoptingRef.current.delete(id);
      }
    },
    [refresh, flush],
  );

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

  const classified = pending.map((item) => ({ item, kind: classifyQueueItem(item, identity) }));
  const own = classified.filter((c) => c.kind === 'own').map((c) => c.item);
  const pendingOnly = own.filter((item) => item.status !== 'failed');
  const failedOnly = own.filter((item) => item.status === 'failed');
  // Only what the person needs to recognise their own report -- never a
  // foreign draft's photo, notes or coordinates, and no coordinates at all.
  const adoptable = classified
    .filter((c) => c.kind === 'adoptable')
    .map(({ item }) => ({
      id: item.id,
      title: item.payload?.title || 'Untitled report',
      savedAt: item.created,
      hasPhoto: Boolean(item.payload?.image_url),
    }));
  const adoptableCount = adoptable.length;
  const foreignCount = classified.filter((c) => c.kind === 'foreign').length;

  return {
    pending: pendingOnly,
    pendingCount: pendingOnly.length,
    failed: failedOnly,
    failedCount: failedOnly.length,
    adoptable,
    adoptableCount,
    foreignCount,
    identity,
    adoptOne,
    syncing,
    flush,
    retryFailed,
    refresh,
  };
}
