import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { listCaptures, removeCapture } from "@/lib/offlineQueue";

export function useOfflineSync() {
  const [pending, setPending] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try { setPending(await listCaptures()); } catch { setPending([]); }
  }, []);

  const flush = useCallback(async () => {
    setSyncing(true);
    try {
      const items = await listCaptures();
      for (const item of items) {
        try {
          await base44.entities.Location.create(item.payload);
          await removeCapture(item.id);
        } catch { /* leave for next attempt */ }
      }
    } finally {
      setSyncing(false);
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("ooh-queue-changed", onChange);
    return () => window.removeEventListener("ooh-queue-changed", onChange);
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => flush();
    window.addEventListener("online", onOnline);
    const timer = setInterval(() => { if (navigator.onLine) flush(); }, 30000);
    return () => { window.removeEventListener("online", onOnline); clearInterval(timer); };
  }, [flush]);

  return { pending, pendingCount: pending.length, syncing, flush, refresh };
}