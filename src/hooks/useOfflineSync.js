import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { listCaptures, removeCapture, incrementRetries } from "@/lib/offlineQueue";

export function useOfflineSync() {
  const [pending, setPending] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try { setPending(await listCaptures()); } catch { setPending([]); }
  }, []);

  const flush = useCallback(async () => {
    const items = await listCaptures();
    if (!items.length) return; // skip when nothing pending — avoids wasteful polling

    setSyncing(true);
    let changed = false;
    for (const item of items) {
      try {
        await base44.entities.Location.create(item.payload);
        await removeCapture(item.id);
        changed = true;
      } catch (err) {
        console.warn("Offline sync failed for item", item.id, err?.message);
        await incrementRetries(item.id); // auto-evicts after MAX_RETRIES
        changed = true;
      }
    }
    setSyncing(false);
    if (changed) refresh();
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