import { useState } from "react";
import { Crosshair, Menu, Tv, Map as MapIcon, Compass, Gauge } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ooh/ThemeToggle";
import HapticsToggle from "@/components/ooh/cognitive/HapticsToggle";
import SoundToggle from "@/components/ooh/SoundToggle";
import ReadAloudToggle from "@/components/ooh/ReadAloudToggle";
import ClimateClock from "@/components/ooh/ClimateClock";
import TypeEnhancer from "@/components/ooh/TypeEnhancer";
import DashboardDropdown from "@/components/ooh/DashboardDropdown";
import NavMenu from "@/components/ooh/NavMenu";
import OfflineSyncBadge from "@/components/ooh/OfflineSyncBadge";
import { useWalkthrough } from "@/lib/walkthroughContext";

export default function Nav({ onCommand }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { startTour } = useWalkthrough();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-void/70 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex items-center justify-between gap-2 px-3 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-2">
          <ClimateClock />
          <Link to="/" aria-label="Home console" title="Home" className="flex h-8 w-8 items-center justify-center border border-slate2 text-silver transition-colors hover:border-ozone hover:text-ozone">
            <Gauge className="h-3.5 w-3.5" />
          </Link>
          <TypeEnhancer />
          <div className="hidden md:block"><DashboardDropdown /></div>
        </div>

        <div className="flex items-center gap-2">
          <OfflineSyncBadge />
          <ThemeToggle />
          <span data-tour="theme" className="hidden md:flex items-center gap-1.5"><HapticsToggle /><SoundToggle /><ReadAloudToggle /></span>
          <Link to="/map" aria-label="Field map" title="Map" className="hidden h-8 w-8 items-center justify-center border border-slate2 text-silver transition-colors hover:border-ozone hover:text-ozone md:flex">
            <MapIcon className="h-3.5 w-3.5" />
          </Link>
          <button onClick={startTour} aria-label="Start walkthrough" title="Tour" className="hidden h-8 w-8 items-center justify-center border border-slate2 text-silver transition-colors hover:border-ozone hover:text-ozone md:flex">
            <Compass className="h-3.5 w-3.5" />
          </button>
          <Link to="/channel" aria-label="OOH·TV channel" title="OOH·TV" className="hidden h-8 w-8 items-center justify-center border border-slate2 text-silver transition-colors hover:border-ozone hover:text-ozone md:flex">
            <Tv className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-10 items-center gap-2 border border-slate2 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-silver transition-colors hover:border-ozone hover:text-ozone md:h-8"
          >
            <Menu className="h-5 w-5 md:h-4 md:w-4" /> <span className="hidden sm:inline">Menu</span>
          </button>
          <button
            onClick={onCommand}
            className="group flex h-10 items-center gap-2 border-2 border-ozone bg-ozone px-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare md:h-8"
          >
            <Crosshair className="h-4 w-4 md:h-3.5 md:w-3.5" />
            <span className="hidden sm:inline">Command</span>
          </button>
        </div>
      </div>

      <NavMenu open={menuOpen} onClose={() => setMenuOpen(false)} onTour={startTour} />
    </header>
  );
}