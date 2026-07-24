import { useState } from "react";
import { Crosshair, Camera, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ooh/ThemeToggle";
import HapticsToggle from "@/components/ooh/cognitive/HapticsToggle";
import BrandMark from "@/components/ooh/BrandMark";
import NavMenu from "@/components/ooh/NavMenu";
import OfflineSyncBadge from "@/components/ooh/OfflineSyncBadge";

export default function Nav({ onCommand }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-void/70 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 px-3 py-3 md:px-8 md:py-4">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="OOH Earth — home">
          <BrandMark className="h-6 w-6" spinning />
          <span className="font-brand text-sm tracking-tight text-silver transition-colors group-hover:text-ozone">ooh<span className="text-ozone text-glow-ozone">.</span>earth</span>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-dim lg:inline">/ Out Of Hell™</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <OfflineSyncBadge />
          <span data-tour="theme" className="flex items-center gap-1.5"><ThemeToggle /><HapticsToggle /></span>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex items-center gap-2 border border-slate2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone"
          >
            <Menu className="h-4 w-4" /> <span className="hidden sm:inline">Menu</span>
          </button>
          <Link
            to="/report"
            aria-label="Capture & report"
            className="flex items-center gap-2 border border-ozone/70 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-ozone transition-colors hover:bg-ozone hover:text-void md:hidden"
          >
            <Camera className="h-3.5 w-3.5" />
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
      </div>

      <NavMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}