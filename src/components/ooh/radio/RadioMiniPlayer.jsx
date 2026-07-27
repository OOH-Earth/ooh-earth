import { useState, useRef, useEffect } from "react";
import { Radio, Play, Pause, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRadio } from "@/lib/radioContext";

function EqBars({ active, bars = 3 }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-end gap-[1.5px]">
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} className="eq-bar w-[2px] bg-ozone" style={{ height: "8px", animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

export default function RadioMiniPlayer() {
  const { station, playing, volume, error, stations, selectStation, togglePlay, setVolume, toggleMute } = useRadio();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex shrink-0 items-stretch border-r border-slate2/60">
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause radio" : "Play radio"}
        className="flex items-center gap-2 px-3 transition-colors hover:bg-slate2/30"
      >
        {playing ? <Pause className="h-3 w-3 text-ozone" /> : <Play className="h-3 w-3 text-silver/70" />}
        <EqBars active={playing} />
        <span className={`hidden font-mono text-[8px] font-bold uppercase tracking-[0.2em] sm:inline ${playing ? "text-ozone" : "text-dim"}`}>
          {station ? station.name : "Radio"}
        </span>
      </button>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Select station"
        aria-expanded={open}
        className="flex items-center border-l border-slate2/40 px-2 transition-colors hover:bg-slate2/30"
      >
        <ChevronDown className={`h-3 w-3 text-dim transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 z-[200] mt-1 w-[240px] border border-slate2 bg-void shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
          >
            {/* Header + volume */}
            <div className="border-b border-slate2/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-ozone">
                  <Radio className="h-2.5 w-2.5" /> OOH Radio
                </span>
                {station && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={toggleMute} aria-label={volume === 0 ? "Unmute" : "Mute"} className="text-dim transition-colors hover:text-ozone">
                      {volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      aria-label="Volume"
                      className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-slate2 accent-ozone"
                    />
                  </div>
                )}
              </div>
              {error && <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.2em] text-flare">// Stream unavailable</div>}
            </div>

            {/* Station list */}
            <div className="max-h-[220px] overflow-y-auto">
              {stations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectStation(s.id)}
                  className={`flex w-full items-center justify-between border-b border-slate2/30 px-3 py-2 text-left transition-colors hover:bg-slate2/30 ${s.id === station?.id ? "bg-slate2/20" : ""}`}
                >
                  <div className="min-w-0">
                    <div className={`truncate font-display text-[11px] font-medium tracking-[-0.01em] ${s.id === station?.id ? "text-ozone" : "text-silver/80"}`}>
                      {s.name}
                    </div>
                    <div className="font-mono text-[7px] uppercase tracking-[0.15em] text-dim/60">{s.genre}</div>
                  </div>
                  {s.id === station?.id && <EqBars active={playing} bars={3} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}