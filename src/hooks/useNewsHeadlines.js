import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache — a single fetch is shared across every consumer
// (TelemetryBar, NewsTicker, future widgets) so we never double-request.
// Real, latest headlines come from the fieldNews function (OOH industry +
// subvertising movement + ad-ban policy, mixed and cached hourly server-side).
let cache = null;
let promise = null;

export function useNewsHeadlines() {
  const [items, setItems] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let active = true;
    if (cache) {
      setItems(cache);
      setLoading(false);
      return;
    }
    if (!promise) {
      promise = (async () => {
        try {
          const res = await base44.functions.invoke("fieldNews", {});
          const d = res?.data ?? res;
          cache = Array.isArray(d?.items)
            ? d.items
                .filter((it) => it && it.title)
                .map((it) => ({ title: it.title, source: it.source || "", url: it.url || "" }))
            : [];
        } catch {
          cache = [];
        }
        promise = null;
        return cache;
      })();
    }
    promise.then((result) => {
      if (active) {
        setItems(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { items, loading };
}
