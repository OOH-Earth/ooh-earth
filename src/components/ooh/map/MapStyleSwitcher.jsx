import { useState } from "react";
import { Layers, Check } from "lucide-react";
import { useMapStyle } from "@/lib/mapStyleContext";

// Compact map-style picker. Lives on the big maps (field map + portals).
export default function MapStyleSwitcher() {
  const { styles, styleId, setStyleId } = useMapStyle();
  const [open, setOpen] = useState(false);
  const cur = styles.find((s) => s.id === styleId) || styles[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Map style: ${cur.label}`}
        className="flex items-center gap-1.5 border border-slate2 bg-void/80 px-2.5 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-darkgray backdrop-blur-md transition-colors hover:border-ozone hover:text-ozone"
      >
        <Layers className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{cur.label}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[1100]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[1200] mt-1 min-w-[150px] border border-slate2 bg-void/95 py-1 backdrop-blur-md">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => { setStyleId(s.id); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${s.id === styleId ? "text-ozone" : "text-darkgray hover:text-silver"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.id === styleId ? "bg-ozone" : "bg-silver/30"}`} />
                {s.label}
                {s.id === styleId && <Check className="ml-auto h-3 w-3 text-ozone" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}