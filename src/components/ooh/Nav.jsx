import { Crosshair, Megaphone, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ooh/ThemeToggle";
import HapticsToggle from "@/components/ooh/cognitive/HapticsToggle";
import BrandMark from "@/components/ooh/BrandMark";

export default function Nav({ onCommand }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-void/70 backdrop-blur-md">
      <div className="flex items-center justify-between px-3 py-3 md:px-8 md:py-4">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="OOH Earth — home">
          <BrandMark className="h-6 w-6" spinning />
          <span className="font-brand text-sm tracking-tight text-silver transition-colors group-hover:text-ozone">ooh<span className="text-ozone text-glow-ozone">.</span>earth</span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-dim sm:inline">/ Out Of Hell™</span>
        </Link>

        <nav className="hidden items-center gap-6 font-mono text-[10px] uppercase tracking-[0.25em] text-silver/60 md:flex">
          <a href="#mandate" className="transition-colors hover:text-ozone">Mandate</a>
          <a href="#atlas" className="transition-colors hover:text-ozone">Atlas</a>
          <Link to="/map" className="transition-colors hover:text-ozone">Maps</Link>
          <Link to="/inhome" className="transition-colors hover:text-ozone">In-Home</Link>
          <Link to="/zora" className="text-ozone transition-colors hover:text-flare">Zora</Link>
          <Link to="/report" className="transition-colors hover:text-ozone">Report</Link>
          <Link to="/ar" className="flex items-center gap-1 text-ozone transition-colors hover:text-flare">
            <ScanLine className="h-3 w-3" /> AR Lens
          </Link>
          <Link to="/scan" className="transition-colors hover:text-ozone">TrueCost</Link>
          <Link to="/trash" className="transition-colors hover:text-ozone">Trash ID</Link>
          <Link to="/campaign" className="text-ozone transition-colors hover:text-flare">Fund</Link>
          <Link to="/about" className="transition-colors hover:text-ozone">About</Link>
          <Link to="/plans" className="transition-colors hover:text-ozone">Plans</Link>
          <Link to="/dashboard" className="transition-colors hover:text-ozone">Dashboard</Link>
          <Link to="/support" className="transition-colors hover:text-ozone">Support</Link>
        </nav>

        <Link
          to="/report"
          aria-label="Report"
          className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone md:hidden"
        >
          <Megaphone className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Report</span>
        </Link>

        <span data-tour="theme" className="flex items-center gap-1.5"><ThemeToggle /><HapticsToggle /></span>

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