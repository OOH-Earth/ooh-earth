import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache — a single LLM fetch is shared across every consumer
// (TelemetryBar, NewsTicker, future widgets) so we never double-request.
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
          const res = await base44.integrations.Core.InvokeLLM({
            prompt:
              "Return 8 recent real news headlines about outdoor advertising bans, billboard regulation, cities restricting commercial advertising in public spaces, or climate-justice activism against corporate advertising. Use real verifiable headlines from the last 18 months. Include source name and article URL.",
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                headlines: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { title: { type: "string" }, source: { type: "string" }, url: { type: "string" } },
                    required: ["title"],
                  },
                },
              },
              required: ["headlines"],
            },
          });
          cache = res?.headlines || [];
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