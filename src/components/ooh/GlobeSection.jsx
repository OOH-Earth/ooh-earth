import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import Globe3D from "@/components/ooh/Globe3D";
import seedMarkers from "@/components/ooh/mapSeed";

export default function GlobeSection() {
  return (
    <section data-tour="globe" className="relative h-[58dvh] min-h-[360px] w-full overflow-hidden border-b border-slate2/60 bg-void">
      <Globe3D markers={seedMarkers} scrollZoom={false} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1001] flex items-center justify-between px-5 py-4">
        <span className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-ozone" />
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ozone">// orbital atlas</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim/70">{seedMarkers.length} spots · live spin</span>
          <Link
            to="/map"
            className="pointer-events-auto flex items-center gap-1.5 border border-ozone/60 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ozone transition-colors hover:bg-ozone hover:text-void"
          >
            Open field map
          </Link>
        </span>
      </div>
    </section>
  );
}