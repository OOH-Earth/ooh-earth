import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import Globe3D from "@/components/ooh/Globe3D";
import { useLocations } from "@/hooks/useLocations";

const CORNERS = [
  "left-0 top-0 border-l border-t",
  "right-0 top-0 border-r border-t",
  "left-0 bottom-0 border-l border-b",
  "right-0 bottom-0 border-r border-b",
];

export default function GlobeSection() {
  const { markers, live } = useLocations();
  const [rip, setRip] = useState(null);

  const handleClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setRip({ x: e.clientX - r.left, y: e.clientY - r.top, key: Date.now() });
  };

  return (
    <section
      data-tour="globe"
      onClick={handleClick}
      className="group relative isolate h-[58dvh] min-h-[360px] w-full cursor-pointer overflow-hidden border-b border-slate2/60 bg-void transition-all duration-500 hover:border-ozone/40 hover:shadow-[inset_0_0_90px_-24px_rgba(237,255,0,0.2)]"
    >
      <Globe3D markers={markers} activeLayers={["ads"]} scrollZoom={false} />

      {/* hover scan sweep */}
      <div className="pointer-events-none absolute inset-0 z-[1000] overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ozone/60 to-transparent animate-scan" />
      </div>

      {/* corner registration marks */}
      {CORNERS.map((c, i) => (
        <span key={i} className={`pointer-events-none absolute z-[1001] h-5 w-5 border-slate2/40 transition-colors duration-500 group-hover:border-ozone/70 ${c}`} />
      ))}

      {/* click ripple */}
      {rip && (
        <span
          key={rip.key}
          className="ripple-pulse pointer-events-none absolute z-[1002] h-16 w-16 rounded-full border border-ozone"
          style={{ left: rip.x, top: rip.y }}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1003] flex items-center justify-between px-5 py-4">
        <span className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// orbital atlas</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/70">
            {markers.length} spots · {live ? "live sync" : "live spin"}
          </span>
          <Link
            to="/map"
            className="pointer-events-auto flex items-center gap-1.5 border border-ozone/60 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-all hover:bg-ozone hover:text-void active:scale-[0.97]"
          >
            Open field map
          </Link>
        </span>
      </div>
    </section>
  );
}