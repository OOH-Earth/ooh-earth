import { Crosshair, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Nav({ onCommand }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-void/70 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        <a href="#top" className="flex items-center gap-2">
          <span className="font-display text-sm font-black uppercase tracking-[0.3em] text-silver">OOH<span className="text-ozone">.</span>EARTH</span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-dim sm:inline">/ Out Of Hell™</span>
        </a>

        <nav className="hidden items-center gap-6 font-mono text-[10px] uppercase tracking-[0.25em] text-silver/60 md:flex">
          <a href="#mandate" className="transition-colors hover:text-ozone">Mandate</a>
          <a href="#atlas" className="transition-colors hover:text-ozone">Atlas</a>
          <Link to="/map" className="transition-colors hover:text-ozone">Maps</Link>
          <Link to="/report" className="transition-colors hover:text-ozone">Report</Link>
          <Link to="/about" className="transition-colors hover:text-ozone">About</Link>
          <Link to="/plans" className="transition-colors hover:text-ozone">Plans</Link>
          <Link to="/support" className="transition-colors hover:text-ozone">Support</Link>
        </nav>

        <Link
          to="/report"
          className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone md:hidden"
        >
          <Megaphone className="h-3.5 w-3.5" /> Report
        </Link>

        <button
          onClick={onCommand}
          className="group flex items-center gap-2 border-2 border-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:text-void"
          style={{ backgroundColor: "#EDFF00" }}
        >
          <Crosshair className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Command</span>
        </button>
      </div>
    </header>
  );
}