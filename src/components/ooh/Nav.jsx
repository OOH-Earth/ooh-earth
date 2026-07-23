import { Crosshair } from "lucide-react";

export default function Nav({ onCommand }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-void/70 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        <a href="#top" className="font-display text-sm font-black uppercase tracking-[0.3em] text-silver">
          OOH<span className="text-ozone">.</span>EARTH
        </a>

        <nav className="hidden items-center gap-8 font-mono text-[10px] uppercase tracking-[0.25em] text-silver/60 md:flex">
          <a href="#atlas" className="transition-colors hover:text-ozone">Atlas</a>
          <a href="#ledger" className="transition-colors hover:text-ozone">Ledger</a>
          <a href="https://ooh.earth/area/bangkok" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">Maps</a>
          <a href="https://ooh.earth/about" target="_blank" rel="noreferrer" className="transition-colors hover:text-ozone">About</a>
        </nav>

        <button
          onClick={onCommand}
          className="group flex items-center gap-2 border border-ozone/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ozone transition-colors hover:bg-ozone hover:text-void"
        >
          <Crosshair className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Command</span>
        </button>
      </div>
    </header>
  );
}