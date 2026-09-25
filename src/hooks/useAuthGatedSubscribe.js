import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { shouldOpenSubscription, subscribeToEntity } from './authGatedSubscribeCore.js';

// Base44's realtime gateway rejects the Socket.IO CONNECT for anonymous
// sessions (see docs/ops/ooh-earth/01-PRIORITY-QUEUE.md, "P0.1" -- this is
// a platform-side accept/reject policy this app cannot change). Anonymous
// callers who still call `.subscribe()` get a deterministic, harmless
// `connect_error` and never receive events; this hook stops the app from
// making that doomed attempt in the first place, without changing behavior
// for authenticated sessions. It does not touch REST loading -- callers
// keep their own separate fetch effect for initial/fallback data.
export function useAuthGatedSubscribe(entityName, callback) {
  const { authChecked, isAuthenticated } = useAuth();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!shouldOpenSubscription(authChecked, isAuthenticated, entityName)) return undefined;
    return subscribeToEntity(base44.entities, entityName, (...args) =>
      callbackRef.current(...args),
    );
  }, [authChecked, isAuthenticated, entityName]);
}
