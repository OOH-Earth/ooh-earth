import { useState, useEffect } from "react";
import { X, BarChart3 } from "lucide-react";

// Shared field tally widget — closable, terminal-styled.
// Renders on both flat (Leaflet) and globe (MapLibre) maps.
// Mobile: bottom-left (above SpecsBar when flat view). Desktop: left rail.
// Closable — collapses to a small button. State persists via localStorage.
// `className` controls the mobile bottom position; desktop is always left-rail.
export default function FieldTallyWidget({ markers = [], clusters = 0, className = "bottom-3" }) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem("ooh-tally-open") !== "false"; } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem("ooh-tally-open", open ? "true" : "false"); } catch {}
  }, [open]);

  const spots = markers.length;
  const verified = markers.filter((m) => m.status === "verified").length;
  const leads = markers.filter((m) => !m.image && m.status !== "verified").length;

  const stats = [
    { k: "Spots", v: spots, c: "#EDFF00" },
    { k: "Clusters", v: clusters, c: "#FF5C00" },
    { k: "Leads", v: leads, c: "#FF5C00" },
    { k: "Verified", v: verified, c: "#39FF14" },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Show field tally"
        className={`pointer-events-auto absolute ${className} left-3 z-[1000] flex items-center gap-1.5 border border-slate2/70 bg-void/85 px-2.5 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-ozone backdrop-blur-md transition-colors hover:border-ozone md:bottom-auto md:left-3 md:top-[188px]`}
      >
        <BarChart3 className="h-3 w-3" />
        <span>Tally</span>
        <span className="text-silver tabular">{spots}</span>
      </button>
    );
  }

  return (
    <div className={`pointer-events-auto absolute ${className} left-3 z-[1000] flex flex-col border border-slate2/70 bg-void/85 backdrop-blur-md md:bottom-auto md:left-3 md:top-28`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate2/60 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ozone animate-pulse" />
          <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-dim">Field tally</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Hide field tally"
          className="text-dim transition-colors hover:text-flare"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate2/40">
        {stats.map((x) => (
          <div key={x.k} className="bg-void px-2.5 py-1.5">
            <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-dim">{x.k}</div>
            <div className="font-mono text-sm font-bold tabular" style={{ color: x.c }}>{x.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}