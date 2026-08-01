import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Loader2, Radio, X } from "lucide-react";

// Compact environmental alert ticker overlaid on the map.
// Pulls real urgent alerts from verified open-source feeds via LLM + web search.
// Severity: "flash" (flare) for critical hazards, "watch" (ozone) for regional updates.

function Row({ items }) {
  return (
    <>
      {items.map((it, i) => (
        <a
          key={i}
          href={it.url || "#"}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-2 px-4"
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: it.severity === "flash" ? "#FF5C00" : "#EDFF00" }}
          />
          {it.severity === "flash" && (
            <AlertTriangle className="h-3 w-3 shrink-0 text-flare" />
          )}
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
              it.severity === "flash" ? "text-flare" : "text-silver/90"
            }`}
          >
            {it.region && <span className="text-ozone">{it.region} · </span>}
            {it.title}
          </span>
          {it.source && (
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-dim">
              · {it.source}
            </span>
          )}
          <span className="text-slate2">◆</span>
        </a>
      ))}
    </>
  );
}

export default function MapAlertTicker({ onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [slow, setSlow] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Return 6 current urgent environmental alerts and regional updates relevant to public-space activism and climate justice. Focus on: wildfire smoke events, air quality emergencies (PM2.5), flood warnings, heat advisories, industrial pollution incidents, and environmental protest crackdowns. Use real verifiable events from the last 48 hours. For each, provide a short title (max 80 chars), the affected region/city, the source name, article URL, and severity ('flash' for immediate life-safety hazards like wildfires/floods, 'watch' for advisories and regional updates).",
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              alerts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    region: { type: "string" },
                    source: { type: "string" },
                    url: { type: "string" },
                    severity: { type: "string", enum: ["flash", "watch"] },
                  },
                  required: ["title", "severity"],
                },
              },
            },
            required: ["alerts"],
          },
        });
        if (mounted.current) {
          setItems(res?.alerts || []);
          setLoading(false);
        }
      } catch {
        if (mounted.current) {
          setItems([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleClose = () => {
    setDismissed(true);
    onClose?.();
  };

  if (dismissed) return null;

  if (loading) {
    return (
      <div className="pointer-events-auto flex h-8 items-center gap-2 border border-slate2/60 bg-void/90 px-4 backdrop-blur-md">
        <Loader2 className="h-3 w-3 animate-spin text-ozone" />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-dim">
          // acquiring alert feed…
        </span>
      </div>
    );
  }

  if (!items.length) return null;

  const hasFlash = items.some((it) => it.severity === "flash");
  const baseDur = Math.max(60, Math.round((items?.length || 6) * 5));

  return (
    <div className="pointer-events-auto relative flex h-8 w-full items-center gap-2 border border-slate2/60 bg-void/90 backdrop-blur-md">
      <span
        className={`flex shrink-0 items-center gap-1.5 border-r border-slate2/60 px-3 ${
          hasFlash ? "text-flare" : "text-ozone"
        }`}
      >
        {hasFlash ? (
          <AlertTriangle className="h-3 w-3 animate-flicker" />
        ) : (
          <Radio className="h-3 w-3 animate-pulse" />
        )}
        <span className="font-mono text-[8px] font-bold uppercase tracking-[0.25em]">
          {hasFlash ? "Alert" : "Intel"}
        </span>
      </span>
      <div
        className="relative flex flex-1 items-center overflow-hidden"
        onMouseEnter={() => setSlow(true)}
        onMouseLeave={() => setSlow(false)}
      >
        <div
          className="flex w-max animate-marquee items-center"
          style={{ animationDuration: `${slow ? baseDur * 10 : baseDur}s`, willChange: "transform" }}
        >
          <Row items={items} />
          <Row items={items} />
        </div>
      </div>
      <button
        onClick={handleClose}
        aria-label="Dismiss ticker"
        className="flex shrink-0 items-center justify-center border-l border-slate2/60 px-3 text-dim transition-colors hover:text-ozone"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}