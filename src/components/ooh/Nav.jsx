import { useState, useEffect } from "react";
import { Crosshair, Camera, Menu, Tv, Map as MapIcon, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ooh/ThemeToggle";
import HapticsToggle from "@/components/ooh/cognitive/HapticsToggle";
import SoundToggle from "@/components/ooh/SoundToggle";
import ReadAloudToggle from "@/components/ooh/ReadAloudToggle";
import CopyleftLogo from "@/components/ooh/CopyleftLogo";
import SmartDashboard from "@/components/ooh/SmartDashboard";
import NavMenu from "@/components/ooh/NavMenu";
import OfflineSyncBadge from "@/components/ooh/OfflineSyncBadge";
import { useWalkthrough } from "@/lib/walkthroughContext";

export default function Nav({ onCommand }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);
  const { startTour } = useWalkthrough();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" });
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-void/70 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex items-center justify-between gap-2 px-3 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-2.5">
          <Link to="/" className="text-ozone transition-colors hover:text-flare" aria-label="Home">
            <CopyleftLogo className="h-6 w-6" />
          </Link>
          <button
            onClick={() => setDashOpen(true)}
            aria-label="Open dashboard"
            className="flex flex-col items-start leading-none transition-colors hover:text-ozone"
          >
            <span className="font-mono text-[12px] font-bold tabular tracking-[0.12em] text-silver">{time}</span>
            <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-dim">
              <span className="h-1 w-1 rounded-full bg-ozone animate-pulse" />
              dashboard
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <OfflineSyncBadge />
          <span data-tour="theme" className="flex items-center gap-1.5"><ThemeToggle /><HapticsToggle /><SoundToggle /><ReadAloudToggle /></span>
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
            className="group flex items-center gap-2 border-2 border-ozone bg-ozone px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-void transition-colors hover:bg-flare hover:border-flare"
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Command</span>
          </button>
        </div>
      </div>

      <SmartDashboard open={dashOpen} onClose={() => setDashOpen(false)} />
      <NavMenu open={menuOpen} onClose={() => setMenuOpen(false)} onTour={startTour} />
    </header>
  );
}